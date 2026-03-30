"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useApp } from "@/components/providers/app-provider";
import { buttonClasses } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { Panel } from "@/components/ui/panel";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBanner } from "@/components/ui/status-banner";
import { usePresentationHistory } from "@/hooks/use-presentation-history";

const quickModes = [
  {
    title: "Topic to PPT",
    description: "Fastest path when you know the idea but do not want to outline slides manually.",
    href: "/create",
    badge: "Free",
  },
  {
    title: "Notes to PPT",
    description: "Best for pasted notes, research, class summaries, and rough talking points.",
    href: "/create",
    badge: "Pro",
  },
  {
    title: "PDF to PPT",
    description: "Use an uploaded source PDF when you need structure pulled from existing material.",
    href: "/create",
    badge: "Pro",
  },
];

export default function DashboardPage() {
  const { accessToken, currentUser, plan } = useApp();
  const { items, loading, error } = usePresentationHistory(accessToken);
  const recentDecks = items.slice(0, 4);
  const isPaid = currentUser?.can_use_pro_features ?? false;

  const dashboardStats = useMemo(
    () => [
      {
        label: "Saved decks",
        value: String(items.length),
        change: items.length === 0 ? "Nothing saved yet" : "Across all generation modes",
      },
      {
        label: "Current plan",
        value: plan?.current_plan.name ?? "Free",
        change:
          plan?.remaining_topic_generations == null
            ? "Unlimited topic generations"
            : `${plan.remaining_topic_generations} topic generations left today`,
      },
      {
        label: "Template access",
        value: isPaid ? "Premium" : "Basic",
        change: isPaid
          ? "Premium templates and no watermark unlocked"
          : "Upgrade to unlock premium themes and Pro workflows",
      },
    ],
    [isPaid, items.length, plan],
  );

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Dashboard"
        title="Start faster, see your limits clearly, and keep your last decks close."
        description="This should feel like a working studio: choose a mode, understand your plan, and jump back into saved presentations without hunting around."
        actions={
          <>
            <Link href="/create" className={buttonClasses("primary")}>
              Create a deck
            </Link>
            <Link href="/history" className={buttonClasses("secondary")}>
              View history
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {error ? (
        <StatusBanner title="History couldn't be loaded" description={error} tone="danger" />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-cyan">Quick start</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-white">
                Pick the workflow that matches your source material
              </h2>
            </div>
            <Link href="/create" className={buttonClasses("ghost")}>
              Open create
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {quickModes.map((mode) => {
              const locked = mode.badge === "Pro" && !isPaid;

              return (
                <Link
                  key={mode.title}
                  href={mode.href}
                  className="surface-inset rounded-[1.4rem] p-4 transition hover:border-cyan/20 hover:bg-cyan/[0.05]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-xl font-semibold text-white">{mode.title}</h3>
                    <span className="data-chip">{mode.badge}</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-mist">{mode.description}</p>
                  <p className="mt-3 text-sm text-white/85">
                    {locked ? "Upgrade to unlock this workflow." : "Available on your plan."}
                  </p>
                </Link>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-lime">Recent work</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-white">
                Your latest saved presentations
              </h2>
            </div>
            <Link href="/history" className={buttonClasses("ghost")}>
              Open history
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? <p className="text-sm text-mist">Loading recent decks...</p> : null}
            {!loading && recentDecks.length === 0 ? (
              <div className="surface-inset rounded-[1.4rem] p-4 text-sm leading-7 text-mist">
                You have not saved any presentations yet. Generate your first deck to start using
                history like a real workspace.
              </div>
            ) : null}

            {recentDecks.map((deck) => (
              <div key={deck.id} className="surface-inset rounded-[1.4rem] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-white">{deck.title}</h3>
                    <p className="mt-1 text-sm text-mist">
                      {deck.source_type.toUpperCase()} / {deck.template_name ?? deck.template_id}
                    </p>
                  </div>
                  <span className="data-chip">{deck.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm text-mist">
                  <span>{deck.slide_count} slides</span>
                  <span>{deck.watermark_applied ? "Watermarked" : "No watermark"}</span>
                  <span>
                    {new Intl.DateTimeFormat("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(deck.created_at))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
