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
                Your quiz responses were saved and your recommendations were
                recalculated.
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
          </div>
          <p className="text-sm text-slate-600">
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
