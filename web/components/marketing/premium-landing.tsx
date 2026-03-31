"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Crown,
  Download,
  FileText,
  LayoutTemplate,
  Presentation,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";

import { useApp } from "@/components/providers/app-provider";
import { cn } from "@/lib/utils";

type WorkflowStep = {
  title: string;
  body: string;
  kicker: string;
  icon: typeof Wand2;
};

type TemplateShowcase = {
  name: string;
  access: "Free" | "Pro";
  accent: string;
  surface: string;
};

const heroEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const workflowSteps: WorkflowStep[] = [
  {
    title: "Start from whatever you have",
    body: "Type a topic, paste class notes, or upload a PDF when you are ready for Pro.",
    kicker: "Topic, notes, or PDF",
    icon: Wand2,
  },
  {
    title: "Shape the deck before export",
    body: "Pick the slide count, choose a template, and review the generated outline before you download.",
    kicker: "Preview-first workflow",
    icon: LayoutTemplate,
  },
  {
    title: "Export a real presentation",
    body: "Get a structured PPT with speaker notes, history, and plan-aware access to premium output.",
    kicker: "Download-ready PPTX",
    icon: Download,
  },
];

const defaultTemplateShowcase: TemplateShowcase[] = [
  {
    name: "Academic Clean",
    access: "Free",
    accent: "from-sky-500 to-cyan-300",
    surface: "bg-sky-50",
  },
  {
    name: "Modern Dark",
    access: "Free",
    accent: "from-slate-900 to-slate-700",
    surface: "bg-slate-100",
  },
  {
    name: "Seminar Pro",
    access: "Pro",
    accent: "from-violet-600 to-fuchsia-500",
    surface: "bg-violet-50",
  },
  {
    name: "Bold Tech",
    access: "Pro",
    accent: "from-emerald-500 to-lime-300",
    surface: "bg-emerald-50",
  },
];

const freePlanFeatures = [
  "3 topic presentations per day",
  "Basic templates",
  "Presentation history",
  "Watermark on export",
];

const proPlanFeatures = [
  "Unlimited generations",
  "Notes to PPT",
  "PDF to PPT",
  "Premium templates",
  "No watermark",
];

const mockSlides = [
  "Cyber Security Awareness",
  "Common student attack patterns",
  "Password and authentication basics",
  "Phishing detection checklist",
  "Safe browsing and final recap",
];

function SectionEyebrow({
  children,
  tone = "dark",
}: {
  children: string;
  tone?: "dark" | "light";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.24em]",
        tone === "dark"
          ? "border border-white/12 bg-white/6 text-white/72"
          : "border border-slate-200 bg-white text-slate-500",
      )}
    >
      {children}
    </span>
  );
}

function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-100"
    >
      {children}
    </Link>
  );
}

function SecondaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-6 py-3.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/10"
    >
      {children}
    </Link>
  );
}

function ProductMockup({
  featuredTemplate,
  planLabel,
  remainingText,
}: {
  featuredTemplate: string;
  planLabel: string;
  remainingText: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.18, ease: heroEase }}
      className="mx-auto mt-16 max-w-6xl px-5 sm:px-8 lg:px-10"
    >
      <div className="rounded-[2rem] border border-white/10 bg-white/10 p-3 shadow-[0_40px_140px_-50px_rgba(6,10,20,0.9)] backdrop-blur-sm">
        <div className="overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white shadow-[0_30px_90px_-45px_rgba(15,23,42,0.38)]">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              AI-powered workflow
            </div>
          </div>

          <div className="grid lg:grid-cols-[255px_1fr]">
            <div className="border-b border-slate-200 bg-slate-50/90 p-5 lg:border-b-0 lg:border-r">
              <div className="rounded-[1.4rem] bg-slate-900 p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400">
                    <Presentation className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">AI PPT Maker</p>
                    <p className="text-xs text-slate-400">Student presentation workspace</p>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  {[
                    { label: "Topic to PPT", active: true },
                    { label: "Notes to PPT", active: false },
                    { label: "PDF to PPT", active: false },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={cn(
                        "rounded-2xl px-3 py-3 text-sm transition",
                        item.active
                          ? "bg-white text-slate-950"
                          : "bg-white/5 text-slate-300",
                      )}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Input
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Cyber security awareness
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    8 slides, seminar tone, student-friendly flow
                  </p>
                </div>

                <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Template
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{featuredTemplate}</p>
                </div>

                <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Plan
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">{planLabel}</span>
                    <span className="text-xs text-slate-500">{remainingText}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 sm:p-6">
              <div className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
                <div className="rounded-[1.8rem] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#6d28d9_100%)] p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
                        Slide preview
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold">
                        Cyber Security Awareness
                      </h3>
                    </div>
                    <div className="rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white/85">
                      8 slides
                    </div>
                  </div>

                  <div className="mt-10 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.4rem] bg-white p-4 text-slate-900">
                      <div className="h-28 rounded-[1rem] bg-[linear-gradient(135deg,#ede9fe_0%,#dbeafe_100%)] p-4">
                        <div className="h-2.5 w-24 rounded-full bg-slate-900/85" />
                        <div className="mt-4 space-y-2">
                          <div className="h-2 w-full rounded-full bg-slate-400/45" />
                          <div className="h-2 w-5/6 rounded-full bg-slate-400/45" />
                          <div className="h-2 w-2/3 rounded-full bg-slate-400/45" />
                        </div>
                      </div>
                      <p className="mt-3 text-sm font-semibold">Title slide</p>
                    </div>

                    <div className="rounded-[1.4rem] border border-white/12 bg-white/10 p-4">
                      <div className="h-28 rounded-[1rem] border border-white/10 bg-white/8 p-4">
                        <div className="h-2.5 w-20 rounded-full bg-white/70" />
                        <div className="mt-4 space-y-2">
                          <div className="h-2 w-full rounded-full bg-white/18" />
                          <div className="h-2 w-4/5 rounded-full bg-white/18" />
                          <div className="h-2 w-3/5 rounded-full bg-white/18" />
                        </div>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-white">Bullet slide</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {mockSlides.map((slide, index) => (
                    <div
                      key={slide}
                      className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Slide {index + 1}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{slide}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Speaker notes", value: "Included" },
                  { label: "Export format", value: ".pptx" },
                  { label: "History", value: "Saved" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TemplateCard({ item }: { item: TemplateShowcase }) {
  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-[0_14px_40px_-30px_rgba(15,23,42,0.28)]">
      <div
        className={cn(
          "h-44 rounded-[1.3rem] bg-gradient-to-br p-4",
          item.accent,
          item.surface,
        )}
      >
        <div className="flex h-full flex-col rounded-[1.05rem] bg-white/92 p-4 shadow-sm">
          <div className="h-3 w-28 rounded-full bg-slate-900/80" />
          <div className="mt-4 h-20 rounded-[1rem] bg-slate-100 p-4">
            <div className="h-2 w-5/6 rounded-full bg-slate-300" />
            <div className="mt-3 space-y-2">
              <div className="h-2 w-full rounded-full bg-slate-200" />
              <div className="h-2 w-4/5 rounded-full bg-slate-200" />
              <div className="h-2 w-3/5 rounded-full bg-slate-200" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-slate-900">{item.name}</p>
          <p className="mt-1 text-sm text-slate-500">Presentation-ready theme</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
            item.access === "Pro"
              ? "bg-amber-100 text-amber-700"
              : "bg-slate-100 text-slate-600",
          )}
        >
          {item.access === "Pro" ? <Crown className="mr-1 h-3 w-3" /> : null}
          {item.access}
        </span>
      </div>
    </div>
  );
}

function PricingColumn({
  title,
  price,
  subtitle,
  features,
  highlight = false,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  price: string;
  subtitle: string;
  features: string[];
  highlight?: boolean;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[2rem] border p-8",
        highlight
          ? "border-violet-400/30 bg-gradient-to-br from-violet-500/14 via-white/6 to-cyan-400/12 text-white shadow-[0_30px_90px_-45px_rgba(129,140,248,0.7)]"
          : "border-white/10 bg-white/5 text-white",
      )}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/58">{title}</p>
      <div className="mt-6 flex items-end gap-2">
        <span className="text-5xl font-semibold">{price}</span>
        {title === "Pro" ? <span className="pb-2 text-white/55">/ month</span> : null}
      </div>
      <p className="mt-3 max-w-sm text-sm leading-7 text-white/72">{subtitle}</p>

      <div className="mt-8 space-y-3">
        {features.map((feature) => (
          <div
            key={feature}
            className={cn(
              "flex items-center gap-3 rounded-[1.1rem] px-4 py-3 text-sm",
              highlight ? "bg-white/10 text-white" : "bg-white/6 text-white/84",
            )}
          >
            <Check className="h-4 w-4 text-cyan-300" />
            {feature}
          </div>
        ))}
      </div>

      <Link
        href={ctaHref}
        className={cn(
          "mt-8 inline-flex w-full items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold transition duration-200 hover:-translate-y-0.5",
          highlight
            ? "bg-white text-slate-950 hover:bg-slate-100"
            : "bg-white/10 text-white hover:bg-white/15",
        )}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

export function PremiumLanding() {
  const { currentUser, plan, templates } = useApp();

  const freeTemplateCount = templates.filter((item) => !item.is_pro).length || 2;
  const proTemplateCount = templates.filter((item) => item.is_pro).length || 3;
  const featuredTemplate = templates[0]?.name ?? "Academic Clean";
  const isPro = Boolean(currentUser?.can_use_pro_features);
  const primaryHref = currentUser ? "/create" : "/login";
  const primaryLabel = currentUser ? "Open workspace" : "Start free";
  const remainingText = isPro
    ? "Unlimited"
    : `${plan?.remaining_topic_generations ?? plan?.daily_topic_limit ?? 3} left today`;

  const templateShowcase: TemplateShowcase[] =
    templates.length >= 4
      ? templates.slice(0, 4).map((item, index) => ({
          name: item.name,
          access: item.is_pro ? "Pro" : "Free",
          accent:
            defaultTemplateShowcase[index]?.accent ??
            defaultTemplateShowcase[index % defaultTemplateShowcase.length].accent,
          surface:
            defaultTemplateShowcase[index]?.surface ??
            defaultTemplateShowcase[index % defaultTemplateShowcase.length].surface,
        }))
      : defaultTemplateShowcase;

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden">
      <section className="relative overflow-hidden bg-[#060b16] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.24),transparent_24%),radial-gradient(circle_at_20%_24%,rgba(56,189,248,0.18),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(168,85,247,0.2),transparent_22%),linear-gradient(180deg,#060b16_0%,#09101d_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(180deg,rgba(6,11,22,0)_0%,rgba(6,11,22,0.92)_100%)]" />

        <div className="relative mx-auto max-w-5xl px-5 pb-12 pt-10 text-center sm:px-8 lg:px-10 lg:pt-14">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: heroEase }}
          >
            <SectionEyebrow>AI PPT Maker</SectionEyebrow>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.06, ease: heroEase }}
            className="mx-auto mt-6 max-w-4xl text-balance text-[clamp(2.9rem,7vw,6rem)] font-semibold leading-[0.94] tracking-[-0.05em]"
          >
            Turn a topic, notes, or PDF into a polished presentation that actually feels ready.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12, ease: heroEase }}
            className="mx-auto mt-6 max-w-2xl text-balance text-base leading-8 text-slate-300 sm:text-lg"
          >
            AI PPT Maker gives students one clean workflow for planning slides, choosing templates,
            reviewing structure, and downloading a real PPT without wrestling with blank decks.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18, ease: heroEase }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <PrimaryLink href={primaryHref}>
              {primaryLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </PrimaryLink>
            <SecondaryLink href="/pricing">See Pro plan</SecondaryLink>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.24, ease: heroEase }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-300"
          >
            <div className="inline-flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-cyan-300" />
              3 free topic decks per day
            </div>
            <div className="inline-flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4 text-cyan-300" />
              {freeTemplateCount} free templates, {proTemplateCount} premium
            </div>
            <div className="inline-flex items-center gap-2">
              <FileText className="h-4 w-4 text-cyan-300" />
              Speaker notes, history, and PPTX download
            </div>
          </motion.div>
        </div>

        <ProductMockup
          featuredTemplate={featuredTemplate}
          planLabel={isPro ? "Pro" : "Free"}
          remainingText={remainingText}
        />
      </section>

      <section id="features" className="bg-[#f5f7fb] text-slate-900">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <SectionEyebrow tone="light">Workflow</SectionEyebrow>
            <h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
              One clean flow from messy source material to export-ready slides.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
              The page does not need to shout. It needs to show a believable product rhythm: start
              with input, preview the structure, then export the finished deck.
            </p>
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-3 lg:gap-12">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div key={step.title} className="relative">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      0{index + 1} {step.kicker}
                    </div>
                  </div>

                  <h3 className="mt-6 max-w-xs text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mt-4 max-w-sm text-base leading-8 text-slate-600">{step.body}</p>

                  {index < workflowSteps.length - 1 ? (
                    <div className="mt-10 hidden h-px bg-gradient-to-r from-slate-300 to-transparent lg:block" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="templates" className="bg-white text-slate-900">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[0.84fr_1.16fr] lg:px-10">
          <div className="flex flex-col justify-center">
            <SectionEyebrow tone="light">Templates</SectionEyebrow>
            <h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Templates should feel like finished presentation design, not placeholder skins.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Free users get strong basics. Pro unlocks darker, bolder, more premium visual
              styles, plus no watermark and access to Notes to PPT and PDF to PPT.
            </p>

            <div className="mt-8 space-y-4">
              {[
                `${freeTemplateCount} templates available on Free`,
                `${proTemplateCount} premium templates on Pro`,
                "Watermark-free exports for paid plans",
                "Clear plan gating before generation",
              ].map((line) => (
                <div key={line} className="flex items-center gap-3 text-sm text-slate-600">
                  <Check className="h-4 w-4 text-emerald-500" />
                  {line}
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <PrimaryLink href={primaryHref}>Try templates</PrimaryLink>
              <Link
                href="/templates"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50"
              >
                Browse template list
              </Link>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {templateShowcase.map((item) => (
              <TemplateCard key={item.name} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#edf1f7] text-slate-900">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <SectionEyebrow tone="light">Student-first</SectionEyebrow>
              <h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
                Built for seminar decks, project reviews, and fast last-minute presentation prep.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                The product is strongest when it gets out of the way. That means cleaner hierarchy,
                meaningful defaults, and a clear upgrade story instead of a cluttered dashboard.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Topic to PPT",
                  body: "Free users can start with the fastest generation flow immediately.",
                  icon: Wand2,
                },
                {
                  title: "Notes to PPT",
                  body: "Pro turns rough class notes into a structured deck with speaker notes.",
                  icon: FileText,
                },
                {
                  title: "PDF to PPT",
                  body: "Upload long references and convert them into presenter-friendly slides.",
                  icon: Upload,
                },
                {
                  title: "Download history",
                  body: "Return to old decks, reopen previews, and grab the download link again.",
                  icon: Download,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-[1.6rem] border border-white/70 bg-white p-5 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.35)]"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-slate-950">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-[#08101c] text-white">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <SectionEyebrow>Pricing</SectionEyebrow>
            <h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Start free. Upgrade only when you want premium generation and cleaner exports.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-300 sm:text-lg">
              Free is enough to understand the product. Pro removes the daily cap, unlocks premium
              generation modes, and keeps the final deck free from watermarking.
            </p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            <PricingColumn
              title="Free"
              price="INR 0"
              subtitle="Best for trying Topic to PPT, basic templates, and the saved history flow."
              features={freePlanFeatures}
              ctaHref={primaryHref}
              ctaLabel={isPro ? "Open workspace" : "Start on Free"}
            />
            <PricingColumn
              title="Pro"
              price="INR 199"
              subtitle="For students who want premium templates, PDF or Notes workflows, and unlimited creation."
              features={proPlanFeatures}
              highlight
              ctaHref="/pricing"
              ctaLabel={isPro ? "Manage Pro plan" : "Upgrade to Pro"}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
