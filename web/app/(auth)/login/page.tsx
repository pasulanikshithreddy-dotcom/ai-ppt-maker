"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { MarketingShell } from "@/components/layout/marketing-shell";
import { useApp } from "@/components/providers/app-provider";
import { buttonClasses } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { StatusBanner } from "@/components/ui/status-banner";
import { Tag } from "@/components/ui/tag";

const benefits = [
  "Save decks and reopen them from history",
  "Keep free and Pro access rules synced to your account",
  "Use the same login for create, templates, pricing, and downloads",
];

export default function LoginPage() {
  const router = useRouter();
  const { authStatus, signInWithPassword, signUpWithPassword, supabaseReady } = useApp();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "authenticated") {
      router.replace("/dashboard");
    }
  }, [authStatus, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "login") {
        await signInWithPassword(email, password);
        setSuccess("Signed in successfully. Redirecting to your dashboard...");
        router.replace("/dashboard");
      } else {
        const result = await signUpWithPassword(email, password, fullName);
        setSuccess(
          result.requiresEmailVerification
            ? "Account created. Check your email to verify before signing in."
            : "Account created successfully. Redirecting to your dashboard...",
        );
        if (!result.requiresEmailVerification) {
          router.replace("/dashboard");
        }
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MarketingShell>
      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Tag tone="cyan">Supabase Auth</Tag>
            <Tag tone="lime">Free plan by default</Tag>
            <Tag>One workspace</Tag>
          </div>

          <div>
            <p className="eyebrow text-cyan">Account access</p>
            <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Sign in and keep your presentation workflow in one place.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-mist">
              Your account connects create flows, plan limits, saved presentation history, and
              upgrade access so the app behaves like a real product, not a throwaway form.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit} className="surface-card rounded-[1.4rem] p-4 text-sm text-white/90">
                {benefit}
              </div>
            ))}
          </div>

          <Panel className="mesh-panel">
            <p className="eyebrow text-lime">After login</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-white/88">
              <p>1. Open Create and choose Topic, Notes, or PDF.</p>
              <p>2. Pick a template that matches your plan.</p>
              <p>3. Save the output and reopen it later from History.</p>
            </div>
          </Panel>
        </div>

        <Panel className="mx-auto w-full max-w-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-cyan">Sign in</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-white">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
            </div>
            <span className="data-chip">{mode === "login" ? "Login" : "Signup"}</span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1">
            <button
              type="button"
              className={`${buttonClasses(mode === "login" ? "primary" : "ghost")} w-full`}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={`${buttonClasses(mode === "signup" ? "primary" : "ghost")} w-full`}
              onClick={() => setMode("signup")}
            >
              Sign up
            </button>
          </div>

          {!supabaseReady ? (
            <StatusBanner
              title="Supabase env vars are missing."
              description="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before using login or signup."
              tone="warning"
              className="mt-5"
            />
          ) : null}

          {error ? (
            <StatusBanner
              title="Authentication failed"
              description={error}
              tone="danger"
              className="mt-5"
            />
          ) : null}
          {success ? (
            <StatusBanner
              title="Auth update"
              description={success}
              tone="success"
              className="mt-5"
            />
          ) : null}

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            {mode === "signup" ? (
              <label className="block text-sm text-mist">
                Full name
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your name"
                  className="form-control mt-2"
                />
              </label>
            ) : null}

            <label className="block text-sm text-mist">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="form-control mt-2"
                required
              />
            </label>

            <label className="block text-sm text-mist">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="form-control mt-2"
                minLength={6}
                required
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className={`${buttonClasses("primary")} flex-1`}
                disabled={!supabaseReady || submitting}
              >
                {submitting
                  ? "Working..."
                  : mode === "login"
                    ? "Continue to dashboard"
                    : "Create account"}
              </button>
              <Link href="/pricing" className={`${buttonClasses("secondary")} flex-1`}>
                Compare plans
              </Link>
            </div>
          </form>

          <div className="soft-divider my-6" />

          <p className="text-sm leading-7 text-mist">
            {mode === "login"
              ? "Use your account to load plan-aware limits, history, and saved deck access."
              : "New accounts start on Free automatically. Pro workflows unlock after upgrade."}
          </p>
        </Panel>
      </section>
    </MarketingShell>
  );
}
