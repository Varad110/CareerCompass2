"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const pathname = usePathname();
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

    const eventSource = new EventSource("/api/events");

    const refresh = () => void loadDashboard();

    eventSource.addEventListener("quiz_completed", refresh);
    eventSource.addEventListener("profile_updated", refresh);

    return () => {
      clearInterval(interval);
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/75 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden rounded-lg p-2 text-slate-700 hover:bg-slate-100">
              {sidebarOpen ? <X /> : <Menu />}
            </button>

            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-slate-800 to-blue-700 shadow-md">
                <Compass className="text-white" />
              </div>
              <span className="hidden text-lg font-bold tracking-tight text-slate-900 sm:block">Career Compass</span>
            </div>
          </div>

          {/* USER */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-r from-blue-700 to-cyan-500 text-sm font-bold text-white shadow-sm">
              {data?.profile.name?.charAt(0) ?? "U"}
            </div>

            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{data?.profile.name}</p>
              <p className="text-xs text-slate-500">{data?.profile.stream} Stream</p>
            </div>

            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              <LogOut />
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex">
        
        {/* SIDEBAR */}
        {sidebarOpen && (
          <aside className="hidden w-64 space-y-4 border-r border-slate-700/60 bg-linear-to-b from-slate-900 to-slate-800 p-6 text-slate-100 shadow-xl backdrop-blur-xl lg:block">
            {[
              { icon: Compass, label: "Dashboard", href: "/dashboard" },
              { icon: Award, label: "Profile", href: "/dashboard/profile" },
              { icon: TrendingUp, label: "Quiz", href: "/dashboard/quiz" },
              { icon: BookOpen, label: "Resources", href: "/dashboard/resources" },
            ].map((item) => (
              <Link key={item.label} href={item.href}>
                <div
                  className={`flex items-center gap-3 rounded-lg p-3 transition ${
                    pathname === item.href
                      ? "bg-blue-500/20 text-white ring-1 ring-blue-300/40"
                      : "text-slate-200 hover:scale-[1.02] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon
                    className={
                      pathname === item.href ? "text-cyan-300" : "text-slate-300"
                    }
                  />
                  {item.label}
                </div>
              </Link>
            ))}
          </aside>
        )}

        {/* MAIN */}
        <main className="flex-1 p-6 space-y-8">

          {/* HEADER */}
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Welcome back, {data?.profile.name} 👋</h1>
            <p className="text-slate-600">AI-powered career insights</p>
          </div>

          {/* STATS */}
          <div className="grid sm:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
              const icons = [Target, BookOpen, TrendingUp, Award];
              const Icon = icons[index];

              return (
                <Card key={stat.label} className="rounded-2xl border border-slate-200/70 bg-white/85 p-6 transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{stat.label}</p>
                      <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                    </div>
                    <Icon className="text-blue-700" />
                  </div>
                </Card>
              );
            })}
          </div>

          {/* CAREERS */}
          <div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900">Top Career Matches</h2>

            <div className="grid md:grid-cols-3 gap-6">
              {data?.matches.map((career) => (
                <Card key={career.rank} className="rounded-2xl border border-slate-200/70 bg-white/85 p-6 transition hover:-translate-y-1 hover:shadow-lg">

                  <div className="flex justify-between">
                    <div className={`w-10 h-10 ${career.color} text-white flex items-center justify-center rounded`}>
                      {career.rank}
                    </div>
                    <Badge className="bg-linear-to-r from-blue-700 to-cyan-500 text-white shadow-sm">
                      Top Match
                    </Badge>
                  </div>

                  <h3 className="mt-3 text-lg font-semibold text-slate-900">{career.title}</h3>

                  <div className="mt-4">
                    <div className="h-3 rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-blue-700 to-cyan-500"
                        style={{ width: `${career.match}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-600">{career.match}% match</p>
                  </div>

                </Card>
              ))}
            </div>
          </div>

          {/* ACTIVITY */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Recent Activity</h2>

            {data?.recentActivity.map((a, i) => (
              <Card key={i} className="mt-3 flex justify-between border border-slate-200/70 bg-white/85 p-4 transition hover:shadow-md">
                <div className="flex gap-3">
                  <Check className="text-emerald-600" />
                  <div>
                    <p className="text-slate-900">{a.action}</p>
                    <p className="text-sm text-slate-500">{a.date}</p>
                  </div>
                </div>
                <Badge className="border border-slate-200 bg-slate-100 text-slate-700">{a.status}</Badge>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="flex justify-between rounded-xl bg-linear-to-r from-slate-900 via-blue-900 to-cyan-700 p-8 text-white shadow-xl">
            <div>
              <h3 className="text-xl font-bold">Improve your results</h3>
              <p className="text-sm text-blue-100">Take quiz to get better matches</p>
            </div>

            <Link href="/dashboard/quiz">
              <Button className="bg-white text-slate-900 transition hover:scale-105 hover:bg-blue-50">
                <Zap className="mr-2" />
                Start Quiz
              </Button>
            </Link>
          </div>

        </main>
      </div>
    </div>
  );
}