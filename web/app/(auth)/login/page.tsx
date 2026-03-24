"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { MarketingShell } from "@/components/layout/marketing-shell";
import { useApp } from "@/components/providers/app-provider";
import { buttonClasses } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { StatusBanner } from "@/components/ui/status-banner";

const benefits = [
  "Save decks and revisit them from history",
  "Sync free and Pro plan rules from the backend",
  "Jump into dashboard, templates, and pricing in one click",
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
      setError(
        nextError instanceof Error ? nextError.message : "Authentication failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MarketingShell>
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-5">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan">Authentication</p>
          <h1 className="font-display text-5xl font-semibold tracking-tight text-white">
            Sign in and get straight to building presentation drafts.
          </h1>
          <p className="max-w-xl text-base leading-8 text-mist">
            Use Supabase Auth to connect your account to saved history, daily topic limits,
            payment upgrades, and plan-aware generation flows.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="surface-card rounded-[1.5rem] p-4 text-sm text-white/90"
              >
                {benefit}
              </div>
            ))}
          </div>
        </div>

        <Panel className="mx-auto w-full max-w-xl p-6 sm:p-7">
          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-lime">Supabase Auth</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-white">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1">
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
                description="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the web app before using login or signup."
                tone="warning"
              />
            ) : null}

            {error ? (
              <StatusBanner title="Authentication failed" description={error} tone="danger" />
            ) : null}
            {success ? (
              <StatusBanner title="Auth update" description={success} tone="success" />
            ) : null}

            <form className="space-y-5" onSubmit={handleSubmit}>
              {mode === "signup" ? (
                <label className="block text-sm text-mist">
                  Full name
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Your name"
                    className="surface-inset mt-2 w-full rounded-2xl px-4 py-3 text-white outline-none transition focus:border-cyan/30"
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
                  className="surface-inset mt-2 w-full rounded-2xl px-4 py-3 text-white outline-none transition focus:border-cyan/30"
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
                  className="surface-inset mt-2 w-full rounded-2xl px-4 py-3 text-white outline-none transition focus:border-cyan/30"
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

            <div className="surface-inset rounded-[1.5rem] p-4 text-sm leading-7 text-mist">
              {mode === "login"
                ? "Use your Supabase email and password to load plan-aware history, generation limits, and saved deck exports."
                : "New accounts start on the free plan automatically, with daily Topic-to-PPT limits and locked Pro workflows until you upgrade."}
            </div>
          </div>
        </Panel>
      </section>
    </MarketingShell>
  );
}
