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
  course: { icon: Video, color: "bg-blue-500", bg: "bg-blue-500/10" },
  book: { icon: BookOpen, color: "bg-green-500", bg: "bg-green-500/10" },
  skill: { icon: Award, color: "bg-purple-500", bg: "bg-purple-500/10" },
  certification: {
    icon: Award,
    color: "bg-orange-500",
    bg: "bg-orange-500/10",
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
            Learning Resources
          </h1>
          <p className="text-xl text-muted-foreground">
            Personalized resources linked to your latest career results.
          </p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading resources...</p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Card className="p-6 border-border/40">
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search resources by name or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border/50 focus:border-primary"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Filter by Career
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCareer(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedCareer === null ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                  >
                    All Careers
                  </button>
                  {careers.map((career) => (
                    <button
                      key={career}
                      onClick={() => setSelectedCareer(career)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedCareer === career ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                    >
                      {career}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Filter by Type
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedType(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedType === null ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                  >
                    All Types
                  </button>
                  {types.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${selectedType === type ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <p className="text-muted-foreground">
          Showing{" "}
          <span className="font-semibold text-foreground">
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
                  className="p-6 border-border/40 flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${config.bg}`}>
                      <TypeIcon className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <Badge
                      variant="outline"
                      className="capitalize border-0 bg-primary/10 text-primary"
                    >
                      {resource.type}
                    </Badge>
                  </div>

                  <div className="mb-4 flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {resource.description}
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border/40">
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary"
                    >
                      {resource.career}
                    </Badge>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="w-full bg-primary hover:bg-primary/90">
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
          <Card className="p-12 border-border/40 text-center space-y-4">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-lg font-semibold text-foreground">
              No resources found
            </p>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
