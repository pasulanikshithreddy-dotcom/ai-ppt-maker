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
  const planName = plan?.current_plan.name ?? currentUser?.plan_code ?? "Free";
  const remainingTopicText =
    plan?.remaining_topic_generations == null
      ? "Unlimited topic generations"
      : `${plan.remaining_topic_generations} topic generations left today`;

  return (
    <div className="page-grid min-h-screen text-white">
      <div className="absolute inset-0 -z-10 bg-grid bg-[size:28px_28px] opacity-[0.08]" />
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-5 sm:px-6 lg:flex-row lg:px-8">
        <aside className="lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)] lg:w-[305px] lg:self-start">
          <div className="surface-card flex h-full flex-col gap-6 rounded-[2rem] p-5">
            <div className="rounded-[1.7rem] border border-white/8 bg-[linear-gradient(180deg,rgba(90,217,255,0.12),rgba(255,255,255,0.02))] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#5ad9ff_0%,#a7f36b_100%)] text-sm font-black text-slate-950">
                  AI
                </div>
                <span className="data-chip text-cyan">{planName}</span>
              </div>
              <h1 className="mt-4 font-display text-[1.7rem] font-semibold text-white">
                AI PPT Maker
              </h1>
              <p className="mt-2 text-sm leading-7 text-mist">
                Create decks from topic, notes, or PDF with one focused workspace for drafting,
                previews, templates, and downloads.
              </p>
            </div>

            <div className="surface-inset rounded-[1.45rem] p-4">
              <p className="eyebrow text-cyan">Account</p>
              {isAuthenticated ? (
                <>
                  <p className="mt-3 text-sm font-semibold text-white">
                    {currentUser.name ?? currentUser.email ?? "Signed in"}
                  </p>
                  {currentUser.email ? (
                    <p className="mt-1 text-sm text-mist">{currentUser.email}</p>
                  ) : null}
                  <div className="mt-4 grid gap-2">
                    <span className="data-chip">{planName}</span>
                    <span className="data-chip">{remainingTopicText}</span>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm leading-7 text-mist">
                  Sign in to sync your plan, history, and generation limits.
                </p>
              )}
            </div>

            <WorkspaceSidebarNav />

            <div className="surface-inset mt-auto rounded-[1.45rem] p-4">
              <p className="eyebrow text-lime">What Pro unlocks</p>
              <div className="mt-3 space-y-2 text-sm leading-7 text-white/88">
                <p>Notes to PPT and PDF to PPT</p>
                <p>Premium templates and no watermark</p>
                <p>Unlimited generations for real workflow use</p>
              </div>
              <Link href="/pricing" className={`${buttonClasses("primary")} mt-4 w-full`}>
                See upgrade options
              </Link>
            </div>
          </div>
        </aside>

        <div className="flex-1 space-y-6">
          <header className="surface-card relative overflow-hidden rounded-[2rem] p-5 md:p-6">
            <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(90,217,255,0.18),transparent_60%)] lg:block" />
            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-3xl">
                <p className="eyebrow text-cyan">Workspace</p>
                <h2 className="mt-3 font-display text-3xl font-semibold text-white xl:text-[2.5rem]">
                  Build decks without losing your place.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-mist sm:text-base">
                  Choose a generation mode, pick a template, preview the structure, and come back
                  to old exports later from the same account-aware workspace.
                </p>
                {isAuthenticated ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="data-chip">{planName}</span>
                    <span className="data-chip">{remainingTopicText}</span>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3">
                {isAuthenticated ? (
                  <>
                    <Link href="/create" className={buttonClasses("primary")}>
                      New presentation
                    </Link>
                    <Link href="/history" className={buttonClasses("secondary")}>
                      Open history
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
                      Login or sign up
                    </Link>
                    <Link href="/pricing" className={buttonClasses("secondary")}>
                      Compare plans
                    </Link>
                  </>
                )}
              </div>
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
              <p className="eyebrow text-cyan">Authentication</p>
              <h3 className="mt-3 font-display text-3xl font-semibold text-white">
                Sign in before you start building.
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-mist">
                Your account keeps free limits, premium access, saved presentations, and downloads
                tied to one workspace so you can move between sessions without losing context.
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
