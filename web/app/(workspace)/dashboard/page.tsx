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

export default function DashboardPage() {
  const { accessToken, currentUser, plan } = useApp();
  const { items, loading, error } = usePresentationHistory(accessToken);
  const recentDecks = items.slice(0, 3);

  const dashboardStats = useMemo(
    () => [
      {
        label: "Saved decks",
        value: String(items.length),
        change: "Synced from your presentation history",
      },
      {
        label: "Current plan",
        value: plan?.current_plan.name ?? (currentUser?.plan_code ?? "Free"),
        change:
          plan?.remaining_topic_generations == null
            ? "Unlimited topic generations"
            : `${plan.remaining_topic_generations} topic generations left today`,
      },
      {
        label: "Template access",
        value: currentUser?.can_use_pro_features ? "Premium" : "Basic",
        change: currentUser?.can_use_pro_features
          ? "Premium templates and no watermark unlocked"
          : "Upgrade to unlock premium themes and exports",
      },
    ],
    [currentUser, items.length, plan],
  );

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Dashboard"
        title="Your slide studio is warmed up and ready."
        description="Track your plan, daily topic allowance, and recent exports without leaving the workspace."
        actions={
          <>
            <Link href="/create" className={buttonClasses("primary")}>
              Create deck
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

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan">Recent decks</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-white">
                Pick up where you left off
              </h2>
            </div>
            <Link href="/history" className={buttonClasses("ghost")}>
              Open history
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? <p className="text-sm text-mist">Loading recent decks...</p> : null}
            {!loading && recentDecks.length === 0 ? (
              <div className="surface-inset rounded-[1.5rem] p-4 text-sm text-mist">
                Your saved presentations will appear here after the first successful generation.
              </div>
            ) : null}
            {recentDecks.map((deck) => (
              <div key={deck.id} className="surface-inset rounded-[1.5rem] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-white">{deck.title}</h3>
                    <p className="mt-1 text-sm text-mist">
                      {deck.source_type.toUpperCase()} • {deck.template_name ?? deck.template_id}
                    </p>
                  </div>
                  <div className="text-sm text-cyan">{deck.status}</div>
                </div>
                <p className="mt-3 text-sm text-mist">
                  {new Intl.DateTimeFormat("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(deck.created_at))}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <p className="text-xs uppercase tracking-[0.22em] text-lime">Plan status</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">
            What your current plan unlocks
          </h2>
          <div className="mt-5 space-y-3">
            {(plan?.current_plan.features ?? []).map((feature, index) => (
              <div key={feature.key} className="surface-inset flex gap-4 rounded-[1.5rem] p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan/12 text-cyan">
                  {index + 1}
                </div>
                <p className="text-sm leading-7 text-white/90">
                  {feature.included ? "Included" : "Locked"}: {feature.label}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
