"use client";

import Link from "next/link";

import { useApp } from "@/components/providers/app-provider";
import { buttonClasses } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { Panel } from "@/components/ui/panel";
import { StatusBanner } from "@/components/ui/status-banner";

export default function ProfilePage() {
  const { accountError, currentUser, plan, refreshAccount, signOut } = useApp();
  const initials = (currentUser?.name || currentUser?.email || "AI")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Profile"
        title="Your account, preferences, and upgrade path in one place."
        description="Manage the authenticated account connected to Supabase Auth, review your current plan, and jump into upgrades or sign-out actions."
        actions={
          <Link href="/pricing" className={buttonClasses("secondary")}>
            Manage plan
          </Link>
        }
      />

      {accountError ? (
        <StatusBanner title="Profile sync issue" description={accountError} tone="danger" />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan">Profile card</p>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-[linear-gradient(135deg,#0accff_0%,#95ff70_100%)] font-display text-2xl font-semibold text-slate-950">
              {initials}
            </div>
            <div>
              <h2 className="font-display text-3xl font-semibold text-white">
                {currentUser?.name ?? "AI PPT Maker User"}
              </h2>
              <p className="mt-1 text-sm text-mist">
                {currentUser?.email ?? "Sign in to load your account email"}
              </p>
              <p className="mt-3 text-sm text-cyan">
                {plan?.current_plan.name ?? "Free"} plan •{" "}
                {currentUser?.can_use_pro_features ? "Premium features unlocked" : "Free tier active"}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className={buttonClasses("secondary")}
              onClick={() => void refreshAccount()}
            >
              Refresh account
            </button>
            <button type="button" className={buttonClasses("ghost")} onClick={() => void signOut()}>
              Logout
            </button>
          </div>
        </Panel>

        <Panel>
          <p className="text-xs uppercase tracking-[0.22em] text-lime">Plan features</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {(plan?.current_plan.features ?? []).map((feature) => (
              <div
                key={feature.key}
                className="surface-inset rounded-[1.5rem] p-4 text-sm text-white/90"
              >
                {feature.included ? "Included" : "Locked"}: {feature.label}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
