"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Award, BookOpen, Globe, Search, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Resource = {
  id: number;
  title: string;
  type: "course" | "book" | "skill" | "certification";
  career: string;
  description: string;
  url: string;
};

type ResourcesResponse = {
  ok: boolean;
  resources: Resource[];
};

const typeConfig = {
  course: {
    icon: Video,
    iconColor: "text-blue-700",
    iconBg: "bg-blue-100",
  },
  book: {
    icon: BookOpen,
    iconColor: "text-emerald-700",
    iconBg: "bg-emerald-100",
  },
  skill: {
    icon: Award,
    iconColor: "text-violet-700",
    iconBg: "bg-violet-100",
  },
  certification: {
    icon: Award,
    iconColor: "text-amber-700",
    iconBg: "bg-amber-100",
  },
};

export default function ResourcesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null);

  const loadResources = async () => {
    try {
      const response = await fetch("/api/resources", { cache: "no-store" });
      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const result = (await response.json()) as ResourcesResponse;
      if (!response.ok || !result.ok) {
        setError("Unable to load resources.");
        return;
      }

      setResources(result.resources);
      setError("");
    } catch {
      setError("Network error while loading resources.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadResources();
    const interval = setInterval(() => {
      void loadResources();
    }, 20000);

    // Connect to SSE for real-time resource updates
    const eventSource = new EventSource("/api/events");

    const handleResultsUpdate = () => {
      void loadResources();
    };

    eventSource.addEventListener("quiz_completed", handleResultsUpdate);

    return () => {
      clearInterval(interval);
      eventSource.removeEventListener("quiz_completed", handleResultsUpdate);
      eventSource.close();
    };
  }, []);

  const filteredResources = useMemo(
    () =>
      resources.filter((resource) => {
        const matchesSearch =
          resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          resource.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesType = !selectedType || resource.type === selectedType;
        const matchesCareer =
          !selectedCareer || resource.career === selectedCareer;

        return matchesSearch && matchesType && matchesCareer;
      }),
    [resources, searchQuery, selectedCareer, selectedType],
  );

  const careers = useMemo(
    () => Array.from(new Set(resources.map((r) => r.career))),
    [resources],
  );
  const types = useMemo(
    () => Array.from(new Set(resources.map((r) => r.type))),
    [resources],
  );

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-lg sm:p-8">
          <div className="space-y-3">
            <p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
              Curated Learning Hub
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Learning Resources
            </h1>
            <p className="max-w-3xl text-lg text-slate-600">
              Personalized, role-specific resources tailored to your latest
              assessment results.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-600">Loading resources...</p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Card className="border border-slate-200/80 bg-white/90 p-6 shadow-md">
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search resources by name or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400 focus:border-blue-400"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">
                  Filter by Career
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCareer(null)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${selectedCareer === null ? "bg-linear-to-r from-blue-700 to-cyan-500 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                  >
                    All Careers
                  </button>
                  {careers.map((career) => (
                    <button
                      key={career}
                      onClick={() => setSelectedCareer(career)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${selectedCareer === career ? "bg-linear-to-r from-blue-700 to-cyan-500 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                    >
                      {career}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">
                  Filter by Type
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedType(null)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${selectedType === null ? "bg-linear-to-r from-blue-700 to-cyan-500 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                  >
                    All Types
                  </button>
                  {types.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${selectedType === type ? "bg-linear-to-r from-blue-700 to-cyan-500 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <p className="text-slate-600">
          Showing{" "}
          <span className="font-semibold text-slate-900">
            {filteredResources.length}
          </span>{" "}
          resources
        </p>

        {filteredResources.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredResources.map((resource) => {
              const config = typeConfig[resource.type];
              const TypeIcon = config.icon;

              return (
                <Card
                  key={resource.id}
                  className="flex flex-col border border-slate-200/80 bg-white/90 p-6 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`rounded-lg p-3 ${config.iconBg}`}>
                      <TypeIcon className={`h-6 w-6 ${config.iconColor}`} />
                    </div>
                    <Badge
                      variant="outline"
                      className="capitalize border-blue-200 bg-blue-50 text-blue-700"
                    >
                      {resource.type}
                    </Badge>
                  </div>

                  <div className="mb-4 flex-1">
                    <h3 className="mb-2 text-lg font-semibold text-slate-900">
                      {resource.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {resource.description}
                    </p>
                  </div>

                  <div className="space-y-4 border-t border-slate-200 pt-4">
                    <Badge
                      variant="secondary"
                      className="border border-slate-200 bg-slate-100 text-slate-700"
                    >
                      {resource.career}
                    </Badge>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="w-full bg-linear-to-r from-blue-700 to-cyan-500 text-white hover:opacity-95">
                        <Globe className="w-4 h-4 mr-2" />
                        Access Resource
                      </Button>
                    </a>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="space-y-4 border border-slate-200/80 bg-white/90 p-12 text-center shadow-md">
            <Search className="mx-auto h-12 w-12 text-slate-300" />
            <p className="text-lg font-semibold text-slate-900">
              No resources found
            </p>
            <p className="text-slate-600">
              Try adjusting your search or filters
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
