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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
            Your Career Results
          </h1>
          <p className="text-xl text-muted-foreground">
            These recommendations update automatically from your latest profile
            and quiz data.
          </p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading results...</p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Tabs defaultValue="careers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50 border-border/40">
            <TabsTrigger
              value="careers"
              className="data-[state=active]:bg-background"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Top Careers
            </TabsTrigger>
            <TabsTrigger
              value="traits"
              className="data-[state=active]:bg-background"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Your Traits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="careers" className="space-y-6 mt-8">
            <div className="space-y-4">
              {careerResults.map((career) => (
                <Card key={career.rank} className="p-6 sm:p-8 border-border/40">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <div className="flex items-start gap-4">
                      <Badge
                        variant="outline"
                        className="bg-primary/10 text-primary border-primary/20 text-lg px-3 py-1"
                      >
                        #{career.rank}
                      </Badge>
                      <div>
                        <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                          {career.title}
                        </h3>
                        <p className="text-muted-foreground mt-1">
                          Match powered by your account data
                        </p>
                      </div>
                    </div>

                    <div className="relative w-16 h-16 rounded-lg bg-secondary flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">
                        {career.match}
                      </span>
                      <span className="text-xs text-muted-foreground absolute -bottom-5">
                        % Match
                      </span>
                    </div>
                  </div>

                  <div className="mb-6 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${career.match}%` }}
                    />
                  </div>

                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {career.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {career.traits.map((trait) => (
                      <Badge
                        key={trait}
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/20 capitalize"
                      >
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-8 border-border/40 bg-gradient-to-r from-accent/10 to-primary/10 border-primary/20">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">
                  Next Steps
                </h3>
                <p className="text-muted-foreground">
                  Use the resources page to start learning skills for your top
                  match.
                </p>
                <Link href="/dashboard/resources">
                  <Button
                    className="bg-primary hover:bg-primary/90"
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
                <Card key={trait.trait} className="p-6 border-border/40">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-foreground capitalize">
                        {trait.trait}
                      </h4>
                      <span className="text-lg font-bold text-primary">
                        {trait.score}%
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
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
