"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  Compass,
  LogOut,
  Menu,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

type DashboardMatch = {
  rank: number;
  title: string;
  match: number;
  color: string;
};

type DashboardActivity = {
  action: string;
  date: string;
  status: string;
};

type DashboardPayload = {
  ok: boolean;
  profile: {
    name: string;
    grade: string;
    stream: string;
  };
  matches: DashboardMatch[];
  stats: {
    grade: string;
    stream: string;
    testsDone: number;
    topMatchScore: number;
  };
  recentActivity: DashboardActivity[];
};

export default function DashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<DashboardPayload | null>(null);

  const loadDashboard = async () => {
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const result = (await response.json()) as DashboardPayload;

      if (!response.ok || !result.ok) {
        setError("Unable to load your dashboard right now.");
        return;
      }

      setData(result);
      setError("");
    } catch {
      setError("Network error while loading dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
    const interval = setInterval(() => {
      void loadDashboard();
    }, 15000);

    // Connect to SSE for real-time dashboard updates
    const eventSource = new EventSource("/api/events");

    const handleQuizCompleted = () => {
      void loadDashboard();
    };

    const handleProfileUpdate = () => {
      void loadDashboard();
    };

    eventSource.addEventListener("quiz_completed", handleQuizCompleted);
    eventSource.addEventListener("profile_updated", handleProfileUpdate);

    return () => {
      clearInterval(interval);
      eventSource.removeEventListener("quiz_completed", handleQuizCompleted);
      eventSource.removeEventListener("profile_updated", handleProfileUpdate);
      eventSource.close();
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const stats = useMemo(() => {
    if (!data) {
      return [
        { label: "Grade", value: "-" },
        { label: "Stream", value: "-" },
        { label: "Tests Done", value: "0" },
        { label: "Match Score", value: "0%" },
      ];
    }

    return [
      { label: "Grade", value: data.stats.grade },
      { label: "Stream", value: data.stats.stream },
      { label: "Tests Done", value: String(data.stats.testsDone) },
      { label: "Match Score", value: `${data.stats.topMatchScore}%` },
    ];
  }, [data]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Compass className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground hidden sm:block">
                Career Compass
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">
                {data?.profile.name ?? "Loading..."}
              </p>
              <p className="text-xs text-muted-foreground">
                {data?.profile.stream ?? "-"} Stream
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex">
        {sidebarOpen && (
          <aside className="w-64 border-r border-border/40 bg-secondary/50 p-6 space-y-6 lg:block hidden">
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Navigation
              </h3>
              <nav className="space-y-2">
                {[
                  { icon: Compass, label: "Dashboard", href: "/dashboard" },
                  { icon: Award, label: "Profile", href: "/dashboard/profile" },
                  { icon: TrendingUp, label: "Quiz", href: "/dashboard/quiz" },
                  {
                    icon: BookOpen,
                    label: "Resources",
                    href: "/dashboard/resources",
                  },
                ].map((item) => (
                  <Link key={item.label} href={item.href}>
                    <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="space-y-4 pt-6 border-t border-border/40">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </aside>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Welcome back, {data?.profile.name ?? "Student"}!
            </h1>
            <p className="text-muted-foreground">
              Your dashboard now updates from live database data.
            </p>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading dashboard...</p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="grid sm:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-6 border-border/40">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {stat.value}
                </p>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Your Top Career Matches
              </h2>
              <p className="text-muted-foreground">
                Generated from your current profile and quiz activity.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {(data?.matches ?? []).map((career) => (
                <Card
                  key={career.rank}
                  className="p-6 border-border/40 hover:border-primary/50 hover:shadow-lg transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-10 h-10 rounded-lg ${career.color} flex items-center justify-center text-white font-bold`}
                      >
                        {career.rank}
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-primary/10 text-primary border-primary/20"
                      >
                        Top Match
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {career.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Live recommendation
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${career.color}`}
                          style={{ width: `${career.match}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        {career.match}% compatibility
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Link href="/dashboard/results" className="block">
              <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg transition font-semibold">
                View All Details & Insights
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              Recent Activity
            </h2>
            <div className="space-y-3">
              {(data?.recentActivity ?? []).map((activity, i) => (
                <Card
                  key={`${activity.action}-${i}`}
                  className="p-4 border-border/40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium">
                        {activity.action}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.date}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-500/10 text-green-700 border-0"
                  >
                    {activity.status}
                  </Badge>
                </Card>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/10 border border-primary/20 rounded-xl p-8">
            <div className="flex items-center justify-between gap-8">
              <div className="space-y-3 flex-1">
                <h3 className="text-2xl font-bold text-foreground">
                  Refine Your Recommendations
                </h3>
                <p className="text-muted-foreground">
                  Take or retake the quiz to instantly update your career
                  matches.
                </p>
              </div>
              <Link href="/dashboard/quiz" className="shrink-0">
                <Button className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg transition whitespace-nowrap">
                  <Zap className="w-4 h-4 mr-2" />
                  Start Quiz
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
