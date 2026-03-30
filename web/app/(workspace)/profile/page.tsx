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
        title="Keep your account details and plan status easy to understand."
        description="This page should answer the practical questions quickly: who is signed in, what plan is active, what features are unlocked, and where to go next."
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
          <p className="eyebrow text-cyan">Profile card</p>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-[linear-gradient(135deg,#5ad9ff_0%,#a7f36b_100%)] font-display text-2xl font-semibold text-slate-950">
              {initials}
            </div>
            <div>
              <h2 className="font-display text-3xl font-semibold text-white">
                {currentUser?.name ?? "AI PPT Maker User"}
              </h2>
              <p className="mt-1 text-sm text-mist">
                {currentUser?.email ?? "Sign in to load your account email"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="data-chip">{plan?.current_plan.name ?? "Free"} plan</span>
                <span className="data-chip">
                  {currentUser?.can_use_pro_features ? "Premium features unlocked" : "Free tier active"}
                </span>
              </div>
            </div>
          </div>

          <div className="preview-grid mt-6">
            <div className="surface-inset rounded-[1.3rem] p-4 text-sm text-white/90">
              Email: {currentUser?.email ?? "Not available"}
            </div>
            <div className="surface-inset rounded-[1.3rem] p-4 text-sm text-white/90">
              Plan: {plan?.current_plan.name ?? "Free"}
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
          <p className="eyebrow text-lime">Plan features</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">
            What your current plan includes
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {(plan?.current_plan.features ?? []).map((feature) => (
              <div
                key={feature.key}
                className="surface-inset rounded-[1.3rem] p-4 text-sm text-white/90"
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
