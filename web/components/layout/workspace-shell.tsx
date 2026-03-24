"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { useApp } from "@/components/providers/app-provider";
import { WorkspaceSidebarNav } from "@/components/layout/workspace-sidebar-nav";
import { buttonClasses } from "@/components/ui/button";
import { StatusBanner } from "@/components/ui/status-banner";

export function WorkspaceShell({
  children,
}: {
  children: ReactNode;
}) {
  const {
    accountError,
    accountLoading,
    authStatus,
    currentUser,
    plan,
    signOut,
    supabaseReady,
  } = useApp();

  const isAuthenticated = authStatus === "authenticated" && currentUser;
  const remainingTopicText =
    plan?.remaining_topic_generations == null
      ? "Unlimited"
      : `${plan.remaining_topic_generations} topic generations left today`;

  return (
    <div className="page-grid min-h-screen text-white">
      <div className="absolute inset-0 -z-10 bg-grid bg-[size:28px_28px] opacity-[0.08]" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:flex-row lg:px-8">
        <aside className="lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)] lg:w-72 lg:self-start">
          <div className="surface-card flex h-full flex-col gap-6 rounded-[2rem] p-5">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0accff_0%,#95ff70_100%)] text-sm font-black text-slate-950">
                AI
              </div>
              <h1 className="mt-4 font-display text-2xl font-semibold text-white">AI PPT Maker</h1>
              <p className="mt-2 text-sm leading-7 text-mist">
                Your focused workspace for deck drafts, templates, and fast student presentations.
              </p>
            </div>

            <WorkspaceSidebarNav />

            <div className="surface-inset mt-auto rounded-[1.5rem] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan">Student Pro tip</p>
              <p className="mt-3 text-sm leading-7 text-mist">
                Keep notes, topic, and export decisions in one place so final deck polish feels more like editing than rebuilding.
              </p>
              <Link href="/pricing" className={`${buttonClasses("primary")} mt-4 w-full`}>
                View plans
              </Link>
            </div>
          </div>
        </aside>

        <div className="flex-1 space-y-6">
          <header className="surface-card flex flex-col gap-4 rounded-[2rem] p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan">Workspace</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-white">
                Build, refine, and export without leaving focus mode.
              </h2>
              {isAuthenticated ? (
                <p className="mt-2 text-sm text-mist">
                  {currentUser.email ?? currentUser.name ?? "Signed in"} •{" "}
                  {plan?.current_plan.name ?? currentUser.plan_code} • {remainingTopicText}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              {isAuthenticated ? (
                <>
                  <Link href="/create" className={buttonClasses("primary")}>
                    New deck
                  </Link>
                  <button
                    type="button"
                    className={buttonClasses("ghost")}
                    onClick={() => {
                      void signOut();
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className={buttonClasses("primary")}>
                    Login
                  </Link>
                  <Link href="/pricing" className={buttonClasses("secondary")}>
                    Upgrade options
                  </Link>
                </>
              )}
            </div>
          </header>

          {!supabaseReady ? (
            <StatusBanner
              title="Supabase auth is not configured yet."
              description="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the web app before using authenticated dashboard features."
              tone="warning"
            />
          ) : null}

          {accountError ? (
            <StatusBanner
              title="We couldn't load your account right now."
              description={accountError}
              tone="danger"
            />
          ) : null}

          {accountLoading ? (
            <section className="surface-card rounded-[2rem] p-6">
              <p className="text-sm text-mist">Loading your workspace...</p>
            </section>
          ) : isAuthenticated ? (
            children
          ) : (
            <section className="surface-card rounded-[2rem] p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan">Authentication</p>
              <h3 className="mt-3 font-display text-3xl font-semibold text-white">
                Sign in to create decks, sync history, and unlock your plan features.
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-mist">
                The workspace is connected to Supabase auth and the FastAPI backend, so your usage limits, template access, and saved exports stay tied to your account.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/login" className={buttonClasses("primary")}>
                  Login or sign up
                </Link>
                <Link href="/pricing" className={buttonClasses("secondary")}>
                  Compare plans
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
