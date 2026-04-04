"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Lightbulb, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CareerResult = {
  rank: number;
  careerKey: string;
  title: string;
  match: number;
  description: string;
  traits: string[];
};

type TraitScore = {
  trait: string;
  score: number;
};

type ResultsResponse = {
  ok: boolean;
  results: CareerResult[];
  traits: TraitScore[];
};

export default function ResultsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [careerResults, setCareerResults] = useState<CareerResult[]>([]);
  const [traitScores, setTraitScores] = useState<TraitScore[]>([]);

  const loadResults = async () => {
    try {
      const response = await fetch("/api/results", { cache: "no-store" });
      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const result = (await response.json()) as ResultsResponse;
      if (!response.ok || !result.ok) {
        setError("Unable to load results right now.");
        return;
      }

      setCareerResults(result.results);
      setTraitScores(result.traits);
      setError("");
    } catch {
      setError("Network error while loading results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadResults();
    const interval = setInterval(() => {
      void loadResults();
    }, 15000);

    // Connect to SSE for real-time results updates
    const eventSource = new EventSource("/api/events");

    const handleQuizCompleted = () => {
      void loadResults();
    };

    eventSource.addEventListener("quiz_completed", handleQuizCompleted);

    return () => {
      clearInterval(interval);
      eventSource.removeEventListener("quiz_completed", handleQuizCompleted);
      eventSource.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100">
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-lg sm:p-8">
          <div className="space-y-3">
            <p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
              Career Results Snapshot
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Your Career Results
            </h1>
            <p className="max-w-3xl text-lg text-slate-600">
              Your top matches and traits are presented in a clean, judge-ready
              format that aligns with the rest of the dashboard.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-600">Loading results...</p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Tabs defaultValue="careers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 border border-slate-200 bg-white/80 p-1 shadow-sm">
            <TabsTrigger
              value="careers"
              className="text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Top Careers
            </TabsTrigger>
            <TabsTrigger
              value="traits"
              className="text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Your Traits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="careers" className="space-y-6 mt-8">
            <div className="space-y-4">
              {careerResults.map((career) => (
                <Card
                  key={career.rank}
                  className="border border-slate-200/80 bg-white/90 p-6 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg sm:p-8"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <div className="flex items-start gap-4">
                      <Badge
                        variant="outline"
                        className="border-blue-200 bg-blue-50 px-3 py-1 text-lg text-blue-700"
                      >
                        #{career.rank}
                      </Badge>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                          {career.title}
                        </h3>
                        <p className="mt-1 text-slate-600">
                          Match powered by your account data
                        </p>
                      </div>
                    </div>

                    <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-linear-to-br from-slate-900 to-blue-700 shadow-md">
                      <span className="text-3xl font-bold text-white">
                        {career.match}
                      </span>
                      <span className="absolute -bottom-5 text-xs text-slate-500">
                        % Match
                      </span>
                    </div>
                  </div>

                  <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-blue-700 to-cyan-500"
                      style={{ width: `${career.match}%` }}
                    />
                  </div>

                  <p className="mb-6 leading-relaxed text-slate-600">
                    {career.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {career.traits.map((trait) => (
                      <Badge
                        key={trait}
                        variant="secondary"
                        className="border border-slate-200 bg-slate-100 text-slate-700 capitalize"
                      >
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            <Card className="border border-slate-200/80 bg-linear-to-r from-slate-900 via-blue-900 to-cyan-700 p-8 text-white shadow-xl">
              <div className="space-y-4">
                <h3 className="text-lg font-bold tracking-tight">
                  Next Steps
                </h3>
                <p className="text-blue-100">
                  Use the resources page to strengthen the skills tied to your
                  top matches.
                </p>
                <Link href="/dashboard/resources">
                  <Button
                    className="bg-white text-slate-900 shadow-sm hover:bg-blue-50"
                    variant="default"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    View Resources
                  </Button>
                </Link>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="traits" className="space-y-6 mt-8">
            <div className="grid sm:grid-cols-2 gap-6">
              {traitScores.map((trait) => (
                <Card
                  key={trait.trait}
                  className="border border-slate-200/80 bg-white/90 p-6 shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-slate-900 capitalize">
                        {trait.trait}
                      </h4>
                      <span className="text-lg font-bold text-blue-700">
                        {trait.score}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-blue-700 to-cyan-500"
                        style={{ width: `${trait.score}%` }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
