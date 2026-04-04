"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
};

export default function QuizPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "a" | "b" | "c" | "d">>(
    {},
  );
  const [completed, setCompleted] = useState(false);

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
        setError("Unable to load quiz questions.");
        return;
      }

      setQuestions(result.questions);
      setError("");
    } catch {
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

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });

      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
      };
      if (!response.ok || !result.ok) {
        setError(result.message ?? "Failed to submit quiz.");
        return;
      }

      setCompleted(true);
    } catch {
      setError("Network error while submitting quiz.");
    } finally {
      setSubmitting(false);
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary p-8 text-muted-foreground">
        Loading quiz...
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
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
                Your quiz responses were saved and your recommendations were
                recalculated.
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary p-8 text-muted-foreground">
        No quiz questions found.
      </div>
    );
  }

  const question = questions[currentQuestion];
  const isAnswered = answers[question.id] !== undefined;
  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
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
          </div>
          <p className="text-muted-foreground text-sm">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
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
