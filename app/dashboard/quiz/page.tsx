"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  computeOfflineCareerResults,
  type OfflineQuizQuestion,
} from "@/lib/offline-career-recommendations";

type QuizOption = {
  id: "a" | "b" | "c" | "d";
  text: string;
  trait: string;
};

type QuizQuestion = {
  id: number;
  question: string;
  category: string;
  options: QuizOption[];
};

type QuizQuestionResponse = {
  ok: boolean;
  questions: QuizQuestion[];
  quizVariant?: {
    id: number;
    key: string;
    generationMode: string;
    questionCount: number;
    createdAt: string;
    seedPayload: unknown;
  } | null;
};

type OfflineResultBundle = {
  results: ReturnType<typeof computeOfflineCareerResults>["results"];
  traits: ReturnType<typeof computeOfflineCareerResults>["traits"];
  source: "server" | "offline";
  quizVariantId: number | null;
  createdAt: string;
};

type QuizSubmissionResponse = {
  ok: boolean;
  message?: string;
  results?: ReturnType<typeof computeOfflineCareerResults>["results"];
};

type RegenerateQuizResponse = {
  ok: boolean;
  message?: string;
  quizVariant?: QuizQuestionResponse["quizVariant"];
  questions?: QuizQuestion[];
};

function toGenerationLabel(mode: string | null): string {
  if (mode === "ai") {
    return "AI";
  }

  if (mode === "fallback") {
    return "Fallback";
  }

  return "Seed";
}

function toStorageLabel(source: string | null): string {
  if (source === "fresh") {
    return "New quiz generated and stored";
  }

  if (source === "regenerated") {
    return "Quiz regenerated and stored";
  }

  if (source === "cached") {
    return "Loaded from cache";
  }

  return "Quiz loaded";
}

const QUIZ_CACHE_KEY = "campuscompass.quiz.cache";
const QUIZ_RESULT_CACHE_KEY = "campuscompass.quiz.result";

function canUseBrowserStorage(): boolean {
  return typeof window !== "undefined";
}

function loadCachedQuiz(): QuizQuestionResponse | null {
  if (!canUseBrowserStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(QUIZ_CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as QuizQuestionResponse;
  } catch {
    return null;
  }
}

function saveCachedQuiz(payload: QuizQuestionResponse): void {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(QUIZ_CACHE_KEY, JSON.stringify(payload));
}

function saveCachedResult(payload: OfflineResultBundle): void {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(QUIZ_RESULT_CACHE_KEY, JSON.stringify(payload));
}

export default function QuizPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "a" | "b" | "c" | "d">>(
    {},
  );
  const [completed, setCompleted] = useState(false);
  const [completionSource, setCompletionSource] = useState<
    "server" | "offline" | null
  >(null);
  const [quizVariantId, setQuizVariantId] = useState<number | null>(null);
  const [quizGenerationMode, setQuizGenerationMode] = useState<string | null>(
    null,
  );
  const [quizStorageState, setQuizStorageState] = useState<
    "fresh" | "regenerated" | "cached" | null
  >(null);

  const loadQuestions = async () => {
    try {
      const response = await fetch("/api/quiz/questions", {
        cache: "no-store",
      });
      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const result = (await response.json()) as QuizQuestionResponse;
      if (!response.ok || !result.ok) {
        const cached = loadCachedQuiz();
        if (cached?.questions?.length) {
          setQuestions(cached.questions);
          setQuizVariantId(cached.quizVariant?.id ?? null);
          setQuizGenerationMode(cached.quizVariant?.generationMode ?? "seed");
          setQuizStorageState("cached");
          setError(
            "Loaded cached quiz questions because the network is unavailable.",
          );
          return;
        }

        setError("Unable to load quiz questions.");
        return;
      }

      setQuestions(result.questions);
      setQuizVariantId(result.quizVariant?.id ?? null);
      setQuizGenerationMode(result.quizVariant?.generationMode ?? "seed");
      setQuizStorageState("fresh");
      saveCachedQuiz(result);

      setError("");
    } catch {
      const cached = loadCachedQuiz();
      if (cached?.questions?.length) {
        setQuestions(cached.questions);
        setQuizVariantId(cached.quizVariant?.id ?? null);
        setQuizGenerationMode(cached.quizVariant?.generationMode ?? "seed");
        setQuizStorageState("cached");
        setError(
          "Loaded cached quiz questions because the network is unavailable.",
        );
        return;
      }

      setError("Network error while loading quiz.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQuestions();

    // Connect to SSE for real-time updates
    const eventSource = new EventSource("/api/events");

    const handleQuizCompleted = () => {
      // Another user or session completed a quiz, no action needed
      void loadQuestions();
    };

    eventSource.addEventListener("quiz_completed", handleQuizCompleted);

    return () => {
      eventSource.removeEventListener("quiz_completed", handleQuizCompleted);
      eventSource.close();
    };
  }, []);

  const handleAnswerSelect = (optionId: "a" | "b" | "c" | "d") => {
    if (!questions[currentQuestion]) {
      return;
    }
    setAnswers((prev) => ({
      ...prev,
      [questions[currentQuestion].id]: optionId,
    }));
  };

  const handleSubmit = async () => {
    const payload = Object.entries(answers).map(
      ([questionId, selectedOption]) => ({
        questionId: Number(questionId),
        selectedOption,
      }),
    );

    const offlineBundle = computeOfflineCareerResults(
      questions as OfflineQuizQuestion[],
      answers,
    );

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });

      const result = (await response.json()) as QuizSubmissionResponse;
      if (!response.ok || !result.ok) {
        if (response.status >= 400 && response.status < 500) {
          setError(result.message ?? "Failed to submit quiz.");
          return;
        }

        throw new Error(result.message ?? "Failed to submit quiz.");
      }

      saveCachedResult({
        results: result.results ?? offlineBundle.results,
        traits: offlineBundle.traits,
        source: "server",
        quizVariantId,
        createdAt: new Date().toISOString(),
      });
      setCompleted(true);
      setCompletionSource("server");
    } catch {
      saveCachedResult({
        results: offlineBundle.results,
        traits: offlineBundle.traits,
        source: "offline",
        quizVariantId,
        createdAt: new Date().toISOString(),
      });

      setCompleted(true);
      setCompletionSource("offline");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegenerateQuiz = async () => {
    setRegenerating(true);
    setError("");

    try {
      const response = await fetch("/api/quiz/regenerate", {
        method: "POST",
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const result = (await response.json()) as RegenerateQuizResponse;
      if (!response.ok || !result.ok || !result.questions?.length) {
        setError(result.message ?? "Failed to regenerate quiz.");
        return;
      }

      const payload: QuizQuestionResponse = {
        ok: true,
        questions: result.questions,
        quizVariant: result.quizVariant ?? null,
      };

      setQuestions(result.questions);
      setQuizVariantId(result.quizVariant?.id ?? null);
      setQuizGenerationMode(result.quizVariant?.generationMode ?? "seed");
      setQuizStorageState("regenerated");
      setAnswers({});
      setCurrentQuestion(0);
      saveCachedQuiz(payload);
    } catch {
      setError("Network error while regenerating quiz.");
    } finally {
      setRegenerating(false);
    }
  };

  const progress = useMemo(() => {
    if (!questions.length) {
      return 0;
    }
    return ((currentQuestion + 1) / questions.length) * 100;
  }, [currentQuestion, questions.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-background to-secondary p-8 text-muted-foreground">
        Loading quiz...
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-background to-secondary">
        <div className="max-w-2xl mx-auto px-4 py-20 flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Card className="p-8 sm:p-12 border-border/40 text-center space-y-6 w-full">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-foreground">
                Quiz Completed
              </h2>
              <p className="text-muted-foreground">
                {completionSource === "offline"
                  ? "Your quiz was analyzed locally and saved on this device until the network returns."
                  : "Your quiz responses were saved and your recommendations were recalculated."}
              </p>
            </div>
            <Link href="/dashboard/results" className="block">
              <Button className="w-full bg-primary hover:bg-primary/90">
                View Your Results
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-background to-secondary p-8 text-muted-foreground">
        No quiz questions found.
      </div>
    );
  }

  const question = questions[currentQuestion];
  const isAnswered = answers[question.id] !== undefined;
  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-secondary">
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground">
              Career Assessment
            </span>
            <Badge variant="outline" className="capitalize">
              Mode: {toGenerationLabel(quizGenerationMode)}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {toStorageLabel(quizStorageState)}
          </Badge>
          {quizVariantId ? (
            <Badge variant="outline" className="text-muted-foreground">
              Variant #{quizVariantId}
            </Badge>
          ) : null}
        </div>

        {error ? (
          <p className="text-sm text-destructive mb-4">{error}</p>
        ) : null}

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Progress
            </h2>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card className="p-8 border-border/40 space-y-8 mb-8">
          <div className="flex justify-between items-start">
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/20 capitalize"
            >
              {question.category}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Step {currentQuestion + 1}
            </span>
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              {question.question}
            </h3>
            <p className="text-muted-foreground mt-2">
              Select the option that best describes you
            </p>
          </div>

          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswerSelect(option.id)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  answers[question.id] === option.id
                    ? "border-primary bg-primary/5"
                    : "border-border/40 bg-secondary/30 hover:border-primary/50"
                }`}
              >
                <p className="font-medium text-foreground">{option.text}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  Trait: {option.trait}
                </p>
              </button>
            ))}
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Button
            onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            variant="outline"
            className="border-border/40"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <Button
            onClick={handleRegenerateQuiz}
            disabled={regenerating || submitting}
            variant="outline"
            className="border-border/40"
          >
            {regenerating ? "Regenerating..." : "Regenerate Quiz"}
          </Button>

          {currentQuestion < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestion((prev) => prev + 1)}
              disabled={!isAnswered}
              className="bg-primary hover:bg-primary/90"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="bg-primary hover:bg-primary/90"
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
