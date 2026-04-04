"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Compass, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message ?? "Unable to sign in. Please try again.");
        return;
      }

      // Use hard navigation so middleware sees the freshly set auth cookie.
      window.location.href = "/dashboard";
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary flex flex-col">
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
      <div className="flex-1 flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8 border-border/40">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
              <Compass className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Career Compass
            </h1>
          </div>

          {/* Heading */}
          <div className="text-center mb-8 space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Welcome Back</h2>
            <p className="text-muted-foreground">
              Sign in to continue your career journey
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary border-border/50 focus:border-primary"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary border-border/50 focus:border-primary"
                required
              />
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-border/40" />
            <span className="text-sm text-muted-foreground">
              New to Career Compass?
            </span>
            <div className="flex-1 h-px bg-border/40" />
          </div>

          {/* Sign Up Link */}
          <Link href="/signup">
            <Button
              variant="outline"
              className="w-full border-border/40 hover:bg-secondary"
            >
              Create an Account
            </Button>
          </Link>

          {/* Forgot Password */}
          <div className="mt-4 text-center">
            <button className="text-sm text-primary hover:underline">
              Forgot your password?
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
