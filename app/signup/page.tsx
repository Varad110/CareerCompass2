"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Compass,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Brain,
  Target,
  Zap,
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Account", subtitle: "Your details" },
  { id: 2, title: "Education", subtitle: "Grade & stream" },
  { id: 3, title: "Subjects", subtitle: "Your scores" },
  { id: 4, title: "Skills", subtitle: "Your strengths" },
  { id: 5, title: "Interests", subtitle: "What excites you" },
];

export default function SignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    // Step 1
    name: "",
    email: "",
    password: "",
    // Step 2
    grade: "",
    stream: "",
    // Step 3 - Subject Scores
    mathScore: "",
    scienceScore: "",
    englishScore: "",
    // Step 4 - Skills
    skills: [] as string[],
    // Step 5 - Interests
    interests: [] as string[],
  });

  const skillOptions = [
    "Communication",
    "Problem Solving",
    "Creativity",
    "Leadership",
    "Analytical",
    "Technical",
    "Teamwork",
    "Time Management",
  ];
  const interestOptions = [
    "Technology",
    "Science",
    "Business",
    "Arts",
    "Medicine",
    "Law",
    "Engineering",
    "Teaching",
    "Finance",
    "Social Work",
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.email && formData.password;
      case 2:
        return formData.grade && formData.stream;
      case 3:
        return (
          formData.mathScore && formData.scienceScore && formData.englishScore
        );
      case 4:
        return formData.skills.length >= 2;
      case 5:
        return formData.interests.length >= 2;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          grade: formData.grade,
          stream: formData.stream,
          academicScores: {
            Mathematics: Number(formData.mathScore),
            Science: Number(formData.scienceScore),
            English: Number(formData.englishScore),
          },
          skills: formData.skills,
          interests: formData.interests,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.message ?? "Unable to create account. Please try again.",
        );
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Back Button */}
      <div className="p-4 sm:p-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <Card className="w-full max-w-2xl border-border/40">
          {/* Progress Header */}
          <div className="p-8 border-b border-border/40">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Career Compass
              </h1>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-5 gap-2">
              {STEPS.map((step) => (
                <div key={step.id} className="text-center">
                  <div
                    className={`w-full aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                      currentStep >= step.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <p className="text-xs font-medium mt-2 text-foreground">
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.subtitle}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleComplete} className="p-8 space-y-6">
            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Step 1: Account */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Create Your Account
                  </h2>
                  <p className="text-muted-foreground">
                    Let&apos;s start with your basic information
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-2"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-2"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="mt-2"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Education */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Your Education
                  </h2>
                  <p className="text-muted-foreground">
                    Help us understand your academic level
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="grade">Grade/Year</Label>
                    <select
                      id="grade"
                      name="grade"
                      value={formData.grade}
                      onChange={handleChange}
                      className="w-full mt-2 px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                      required
                    >
                      <option value="">Select your grade</option>
                      <option value="11">Grade 11</option>
                      <option value="12">Grade 12</option>
                      <option value="graduate">Graduate/Professional</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="stream">Stream</Label>
                    <select
                      id="stream"
                      name="stream"
                      value={formData.stream}
                      onChange={handleChange}
                      className="w-full mt-2 px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                      required
                    >
                      <option value="">Select your stream</option>
                      <option value="Science">Science (PCM/PCB)</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Arts">Arts/Humanities</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Subject Scores */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Your Academic Performance
                  </h2>
                  <p className="text-muted-foreground">
                    Tell us about your scores (out of 100)
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="mathScore">Math Score</Label>
                    <Input
                      id="mathScore"
                      name="mathScore"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="85"
                      value={formData.mathScore}
                      onChange={handleChange}
                      className="mt-2"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="scienceScore">Science Score</Label>
                    <Input
                      id="scienceScore"
                      name="scienceScore"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="90"
                      value={formData.scienceScore}
                      onChange={handleChange}
                      className="mt-2"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="englishScore">English Score</Label>
                    <Input
                      id="englishScore"
                      name="englishScore"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="88"
                      value={formData.englishScore}
                      onChange={handleChange}
                      className="mt-2"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Skills */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Your Key Skills
                  </h2>
                  <p className="text-muted-foreground">
                    Select at least 2 skills you&apos;re strong in
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {skillOptions.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`p-4 rounded-lg border-2 transition-all text-center font-medium ${
                        formData.skills.includes(skill)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-foreground hover:border-primary/50"
                      }`}
                    >
                      <Zap className="w-4 h-4 mx-auto mb-2" />
                      {skill}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected: {formData.skills.length} of 2 required
                </p>
              </div>
            )}

            {/* Step 5: Interests */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Your Career Interests
                  </h2>
                  <p className="text-muted-foreground">
                    Select at least 2 fields that interest you
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {interestOptions.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`p-4 rounded-lg border-2 transition-all text-center font-medium ${
                        formData.interests.includes(interest)
                          ? "border-secondary bg-secondary/10 text-secondary"
                          : "border-border bg-background text-foreground hover:border-secondary/50"
                      }`}
                    >
                      <Target className="w-4 h-4 mx-auto mb-2" />
                      {interest}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected: {formData.interests.length} of 2 required
                </p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-6 border-t border-border/40">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  className="flex-1"
                >
                  Previous
                </Button>
              )}
              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex-1 bg-primary hover:bg-primary/90 gap-2"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!canProceed() || loading}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary hover:shadow-lg gap-2"
                >
                  {loading ? "Creating Profile..." : "Complete Setup"}
                  {!loading && <CheckCircle2 className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
