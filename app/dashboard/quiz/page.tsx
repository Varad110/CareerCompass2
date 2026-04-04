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
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 p-8 text-slate-600">
        Loading quiz...
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-2xl mx-auto px-4 py-20 flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Card className="w-full space-y-6 border border-slate-200/70 bg-white/90 p-8 text-center shadow-lg sm:p-12">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-slate-900">
                Quiz Completed
              </h2>
              <p className="text-slate-600">
                {completionSource === "offline"
                  ? "Your quiz was analyzed locally and saved on this device until the network returns."
                  : "Your quiz responses were saved and your recommendations were recalculated."}
              </p>
            </div>
            <Link href="/dashboard/results" className="block">
              <Button className="w-full bg-linear-to-r from-blue-700 to-cyan-500 text-white hover:opacity-95">
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
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 p-8 text-slate-600">
        No quiz questions found.
      </div>
    );
  }

  const question = questions[currentQuestion];
  const isAnswered = answers[question.id] !== undefined;
  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100">
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/75 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-700" />
            <span className="font-semibold text-slate-900">
              Career Assessment
            </span>
            <Badge variant="outline" className="capitalize">
              Mode: {toGenerationLabel(quizGenerationMode)}
            </Badge>
          </div>
          <p className="text-sm text-slate-600">
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
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Progress
            </h2>
            <span className="text-sm text-slate-600">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-linear-to-r from-blue-700 to-cyan-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card className="mb-8 space-y-8 border border-slate-200/70 bg-white/90 p-8 shadow-lg">
          <div className="flex justify-between items-start">
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50 text-blue-700 capitalize"
            >
              {question.category}
            </Badge>
            <span className="text-sm text-slate-600">
              Step {currentQuestion + 1}
            </span>
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-bold leading-tight text-slate-900">
              {question.question}
            </h3>
            <p className="mt-2 text-slate-600">
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
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                }`}
              >
                <p className="font-medium text-slate-900">{option.text}</p>
                <p className="mt-1 text-xs capitalize text-slate-500">
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
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
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
              className="bg-linear-to-r from-blue-700 to-cyan-500 text-white hover:opacity-95"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="bg-linear-to-r from-blue-700 to-cyan-500 text-white hover:opacity-95"
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
