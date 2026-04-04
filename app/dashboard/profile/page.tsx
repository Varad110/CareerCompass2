"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Plus, Trash2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Score = {
  id: number;
  subject: string;
  score: number;
};

type ProfileResponse = {
  ok: boolean;
  profile: {
    name: string;
    email: string;
    grade: string;
    stream: string;
  };
  scores: Score[];
};

export default function ProfilePage() {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    grade: "",
    stream: "",
  });

  const [scores, setScores] = useState<Score[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [newScore, setNewScore] = useState("");
  const [pendingScoreId, setPendingScoreId] = useState<number | null>(null);

  const loadProfile = async () => {
    try {
      const response = await fetch("/api/profile", { cache: "no-store" });
      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const result = (await response.json()) as ProfileResponse;
      if (!response.ok || !result.ok) {
        setError("Could not load profile data.");
        return;
      }

      setProfileData(result.profile);
      setScores(result.scores);
      setError("");
    } catch {
      setError("Network error while loading profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
    const interval = setInterval(() => {
      void loadProfile();
    }, 20000);

    // Connect to SSE for real-time updates
    const eventSource = new EventSource("/api/events");

    const handleProfileUpdate = () => {
      void loadProfile();
    };

    const handleScoreAdded = () => {
      void loadProfile();
    };

    const handleScoreRemoved = () => {
      setPendingScoreId(null);
      void loadProfile();
    };

    eventSource.addEventListener("profile_updated", handleProfileUpdate);
    eventSource.addEventListener("score_added", handleScoreAdded);
    eventSource.addEventListener("score_removed", handleScoreRemoved);

    return () => {
      clearInterval(interval);
      eventSource.removeEventListener("profile_updated", handleProfileUpdate);
      eventSource.removeEventListener("score_added", handleScoreAdded);
      eventSource.removeEventListener("score_removed", handleScoreRemoved);
      eventSource.close();
    };
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    setError("");

    // Optimistic update - immediately show changes in UI
    const previousData = profileData;

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
      };
      if (!response.ok || !result.ok) {
        // Revert on error
        setProfileData(previousData);
        setError(result.message ?? "Failed to save profile.");
        return;
      }

      setEditing(false);
      // No need to reload, optimistic update already applied
      setError("");
    } catch {
      // Revert on network error
      setProfileData(previousData);
      setError("Network error while saving profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddScore = async () => {
    const numeric = Number(newScore);
    if (!newSubject || Number.isNaN(numeric)) {
      return;
    }

    // Optimistic update - add score to UI immediately
    const tempId = Date.now(); // Temporary ID for pending score
    const optimisticScore: Score = {
      id: tempId,
      subject: newSubject,
      score: numeric,
    };

    setScores((prev) => [...prev, optimisticScore]);
    setNewSubject("");
    setNewScore("");

    try {
      const response = await fetch("/api/profile/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: newSubject, score: numeric }),
      });

      if (!response.ok) {
        // Revert optimistic update
        setScores((prev) => prev.filter((s) => s.id !== tempId));
        const result = (await response.json()) as { message?: string };
        setError(result.message ?? "Failed to add score.");
        return;
      }

      // Keep optimistic update, will sync via SSE or next reload
      setError("");
    } catch {
      // Revert on network error
      setScores((prev) => prev.filter((s) => s.id !== tempId));
      setError("Network error while adding score.");
    }
  };

  const handleRemoveScore = async (scoreId: number) => {
    // Optimistic update - remove from UI immediately
    const previousScores = scores;
    setScores((prev) => prev.filter((s) => s.id !== scoreId));
    setPendingScoreId(scoreId);

    try {
      const response = await fetch("/api/profile/scores", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoreId }),
      });

      if (!response.ok) {
        // Revert optimistic update
        setScores(previousScores);
        setPendingScoreId(null);
        const result = (await response.json()) as { message?: string };
        setError(result.message ?? "Failed to delete score.");
        return;
      }

      setError("");
      setPendingScoreId(null);
    } catch {
      // Revert on network error
      setScores(previousScores);
      setPendingScoreId(null);
      setError("Network error while deleting score.");
    }
  };

  const average = useMemo(() => {
    if (!scores.length) {
      return 0;
    }
    return Math.round(
      scores.reduce((acc, item) => acc + item.score, 0) / scores.length,
    );
  }, [scores]);

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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Student Profile
            </h1>
            <p className="text-muted-foreground mt-2">
              Updates appear instantly with optimistic UI and real-time sync.
            </p>
          </div>
          <div className="flex gap-3">
            {editing ? (
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-primary hover:bg-primary/90"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            ) : (
              <Button
                onClick={() => setEditing(true)}
                variant="outline"
                className="border-border/40"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading profile...</p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50 border-border/40">
            <TabsTrigger
              value="personal"
              className="data-[state=active]:bg-background"
            >
              <User className="w-4 h-4 mr-2" />
              Personal Info
            </TabsTrigger>
            <TabsTrigger
              value="academics"
              className="data-[state=active]:bg-background"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Academic Scores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-8">
            <Card className="p-8 border-border/40 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-8 border-b border-border/40">
                <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  <User className="w-12 h-12 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground">
                    {profileData.name || "Student"}
                  </h3>
                  <Badge
                    variant="outline"
                    className="mt-3 bg-primary/10 text-primary border-primary/20"
                  >
                    {profileData.stream || "-"} Stream - Grade{" "}
                    {profileData.grade || "-"}
                  </Badge>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { label: "Full Name", key: "name" as const, type: "text" },
                  { label: "Email", key: "email" as const, type: "email" },
                ].map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    {editing ? (
                      <Input
                        type={field.type}
                        value={profileData[field.key]}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      <p className="px-3 py-2 text-foreground">
                        {profileData[field.key]}
                      </p>
                    )}
                  </div>
                ))}

                <div className="space-y-2">
                  <Label>Grade</Label>
                  {editing ? (
                    <Input
                      value={profileData.grade}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          grade: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <p className="px-3 py-2 text-foreground">
                      {profileData.grade}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Stream</Label>
                  {editing ? (
                    <Input
                      value={profileData.stream}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          stream: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <p className="px-3 py-2 text-foreground">
                      {profileData.stream}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="academics" className="mt-8 space-y-6">
            <div className="space-y-4">
              {scores.map((score) => (
                <Card
                  key={score.id}
                  className={`p-6 border-border/40 transition-opacity ${
                    pendingScoreId === score.id
                      ? "opacity-50 bg-destructive/10 border-destructive/20"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">
                        {score.subject}
                      </h4>
                      <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden max-w-xs">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${score.score}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-2xl font-bold text-primary">
                        {score.score}%
                      </p>
                      <Button
                        onClick={() => handleRemoveScore(score.id)}
                        variant="ghost"
                        size="sm"
                        disabled={pendingScoreId === score.id}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {scores.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No scores added yet. Add your first subject score below!
              </p>
            ) : null}

            <Card className="p-6 border-border/40 bg-secondary/30">
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Subject Score
                </h4>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Input
                    placeholder="Subject"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="sm:col-span-2"
                  />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    value={newScore}
                    onChange={(e) => setNewScore(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleAddScore}
                  disabled={!newSubject || !newScore}
                  className="bg-primary hover:bg-primary/90"
                >
                  Add Score
                </Button>
              </div>
            </Card>

            <Card className="p-8 border-border/40 bg-gradient-to-r from-primary/10 to-accent/10">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-3xl font-bold text-primary mt-1">
                    {average}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Highest Score</p>
                  <p className="text-3xl font-bold text-accent mt-1">
                    {scores.length
                      ? Math.max(...scores.map((s) => s.score))
                      : 0}
                    %
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subjects</p>
                  <p className="text-3xl font-bold text-primary mt-1">
                    {scores.length}
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
