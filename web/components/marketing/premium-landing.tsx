"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Crown,
  Download,
  FileText,
  History,
  LayoutTemplate,
  Lock,
  Play,
  Sparkles,
  Upload,
  Wand2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

import { useApp } from "@/components/providers/app-provider";
import { cn } from "@/lib/utils";

type TabKey = "topic" | "notes" | "pdf";

const heroEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const features: Array<{ icon: LucideIcon; title: string; desc: string }> = [
  {
    icon: Wand2,
    title: "Topic to PPT",
    desc: "Turn a topic into a polished presentation with speaker notes in seconds.",
  },
  {
    icon: FileText,
    title: "Notes to Slides",
    desc: "Paste raw class notes and convert them into clean, structured slides.",
  },
  {
    icon: Upload,
    title: "PDF to PPT",
    desc: "Transform long PDFs into seminar-ready decks with a preview-first workflow.",
  },
  {
    icon: LayoutTemplate,
    title: "Premium Templates",
    desc: "Use academic, modern, dark, and Pro-only presentation styles.",
  },
];

const templateCards = [
  { name: "Academic Clean", tag: "Free" },
  { name: "Modern Dark", tag: "Free" },
  { name: "Seminar Pro", tag: "Pro" },
  { name: "Minimal White", tag: "Pro" },
  { name: "Bold Tech", tag: "Pro" },
] as const;

const previewSlides = [
  "Introduction to Cyber Security",
  "Common Online Threats",
  "Password and Authentication Safety",
  "Phishing Awareness",
  "Best Practices and Final Takeaways",
];

const recentDecks = [
  { title: "Cyber Security Awareness", type: "Topic to PPT", date: "Today" },
  { title: "DBMS Unit 3 Notes", type: "Notes to PPT", date: "Yesterday" },
  { title: "Machine Learning Seminar", type: "PDF to PPT", date: "2 days ago" },
];

function Glow({ className }: { className: string }) {
  return (
    <motion.div
      className={cn("absolute rounded-full blur-3xl opacity-30", className)}
      animate={{ scale: [1, 1.08, 1], x: [0, 12, 0], y: [0, -8, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function Pill({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "violet" | "emerald" | "amber";
}) {
  const tones = {
    slate: "border-white/10 bg-white/5 text-slate-200",
    violet: "border-violet-400/20 bg-violet-500/10 text-violet-200",
    emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-400/20 bg-amber-500/10 text-amber-100",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

function CTA({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-semibold transition duration-200",
        variant === "primary" &&
          "bg-white text-slate-950 hover:-translate-y-0.5 hover:bg-slate-100",
        variant === "secondary" &&
          "border border-white/10 bg-white/5 text-white hover:-translate-y-0.5 hover:bg-white/10",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function PremiumLanding() {
  const [activeTab, setActiveTab] = useState<TabKey>("topic");
  const { currentUser, plan, templates } = useApp();

  const planLabel = currentUser?.can_use_pro_features ? "Pro" : "Free";
  const featuredTemplate = templates[0]?.name ?? "Academic Clean";
  const freeTemplateCount = useMemo(
    () => templates.filter((item) => !item.is_pro).length || 2,
    [templates],
  );
  const proTemplateCount = useMemo(
    () => templates.filter((item) => item.is_pro).length || 3,
    [templates],
  );

  return (
    <div className="-mx-5 sm:-mx-8 lg:-mx-10">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.22),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.18),transparent_28%),radial-gradient(circle_at_20%_80%,rgba(34,211,238,0.15),transparent_30%)]" />
        <Glow className="left-10 top-16 h-56 w-56 bg-violet-500" />
        <Glow className="right-10 top-24 h-72 w-72 bg-cyan-400" />
        <Glow className="bottom-0 left-1/3 h-72 w-72 bg-fuchsia-500" />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-10 lg:py-24">
          <div className="flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0, ease: heroEase }}
            >
              <Pill tone="violet">
                <span className="mr-2 inline-flex">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                New: Notes and PDF to PPT
              </Pill>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: heroEase }}
              className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              Build stunning presentations with a
              <span className="bg-gradient-to-r from-violet-300 via-white to-cyan-300 bg-clip-text text-transparent">
                {" "}
                real product UI
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16, ease: heroEase }}
              className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg"
            >
              Generate decks from topics, notes, and PDFs. Preview the structure before export,
              pick cleaner templates, and track history in a proper product flow instead of a wall
              of text.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24, ease: heroEase }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <CTA href={currentUser ? "/create" : "/login"}>
                {currentUser ? "Open Workspace" : "Start Free"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </CTA>
              <CTA href="/pricing" variant="secondary">
                <Play className="mr-2 h-4 w-4" />
                Compare Plans
              </CTA>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.32, ease: heroEase }}
              className="mt-8 flex flex-wrap gap-4 text-sm text-slate-400"
            >
              {[
                "3 free PPTs/day",
                `${freeTemplateCount} free templates`,
                "Watermark-free Pro export",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.75, ease: heroEase }}
            className="relative"
          >
            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-slate-900/75 shadow-[0_20px_90px_-28px_rgba(139,92,246,0.55)] backdrop-blur-xl">
              <div className="border-b border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <Pill tone="violet">Live Preview</Pill>
                </div>
              </div>

              <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
                <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
                  <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/5 p-1">
                    {(["topic", "notes", "pdf"] as TabKey[]).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          "rounded-xl px-3 py-2 text-sm font-medium transition",
                          activeTab === tab
                            ? "bg-white text-slate-950"
                            : "text-slate-300 hover:bg-white/10 hover:text-white",
                        )}
                      >
                        {tab === "topic" ? "Topic" : tab === "notes" ? "Notes" : "PDF"}
                      </button>
                    ))}
                  </div>

                  {activeTab === "topic" ? (
                    <div className="mt-5 space-y-4">
                      <input
                        readOnly
                        value="Cyber Security Awareness"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          readOnly
                          value="8 slides"
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                        />
                        <input
                          readOnly
                          value="Seminar tone"
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                          Template: <span className="font-medium text-white">{featuredTemplate}</span>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                          Plan: <span className="font-medium text-white">{planLabel}</span>
                        </div>
                      </div>
                      <CTA href={currentUser ? "/create" : "/login"} className="w-full">
                        Generate Presentation
                      </CTA>
                    </div>
                  ) : null}

                  {activeTab === "notes" ? (
                    <div className="mt-5 space-y-4">
                      <textarea
                        readOnly
                        value={
                          "Cyber security protects systems and user data.\nThreats include phishing, malware, weak passwords, and scams.\nAwareness and prevention reduce risk."
                        }
                        className="min-h-[164px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                      />
                      <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-100">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Pro feature
                        </div>
                        <CTA href="/pricing" className="px-4 py-2 text-xs">
                          Upgrade
                        </CTA>
                      </div>
                    </div>
                  ) : null}

                  {activeTab === "pdf" ? (
                    <div className="mt-5 space-y-4">
                      <div className="flex min-h-[164px] items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-slate-300">
                        Drag and drop PDF here or click to upload
                      </div>
                      <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-100">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          Unlock PDF to PPT in Pro
                        </div>
                        <CTA href="/pricing" className="px-4 py-2 text-xs">
                          See Pro
                        </CTA>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">Presentation Preview</div>
                      <div className="text-xs text-slate-400">
                        Generated outline and export progress
                      </div>
                    </div>
                    <Pill tone="emerald">Ready</Pill>
                  </div>

                  <div className="space-y-3">
                    {previewSlides.map((slide, index) => (
                      <motion.div
                        key={slide}
                        initial={{ opacity: 0, x: 18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.16 + index * 0.05, duration: 0.42 }}
                        className="rounded-2xl border border-white/10 bg-white/5 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-white">
                              Slide {index + 1}
                            </div>
                            <div className="text-xs text-slate-400">{slide}</div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-500" />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-300">Export progress</span>
                      <span className="text-white">92%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-violet-400 to-cyan-300" />
                    </div>
                    <div className="mt-4 flex gap-3">
                      <CTA href={currentUser ? "/history" : "/login"} className="flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        Download PPT
                      </CTA>
                      <CTA
                        href={currentUser ? "/history" : "/login"}
                        variant="secondary"
                        className="px-4"
                      >
                        Save
                      </CTA>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
        <Pill>Core Features</Pill>
        <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
          A product UI built for speed, polish, and flow
        </h2>
        <p className="mt-4 max-w-2xl text-slate-400">
          Dynamic forms, stronger hierarchy, clean previews, and a layout that finally feels like
          a product.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
                whileHover={{ y: -8 }}
              >
                <div className="h-full rounded-[28px] border border-white/10 bg-white/5 p-6 hover:border-violet-400/30 hover:bg-white/[0.07]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-400/20 ring-1 ring-white/10">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{feature.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section id="templates" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Pill>Templates</Pill>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Templates that actually feel presentation-ready
            </h2>
            <p className="mt-4 text-slate-400">
              Start with clean free styles, then unlock premium Pro templates for seminar decks,
              tech presentations, and polished academic exports.
            </p>
            <div className="mt-6 space-y-3">
              {[
                "Clean typography and stronger spacing",
                "Visible Free and Pro gating",
                "Sharper selection feedback",
                "Watermark-free export for Pro users",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templateCards.map((template) => (
              <div
                key={template.name}
                className="overflow-hidden rounded-[26px] border border-white/10 bg-white/5"
              >
                <div className="h-28 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-4">
                  <div className="h-full rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))] p-3">
                    <div className="mb-2 h-3 w-2/3 rounded-full bg-white/70" />
                    <div className="space-y-2">
                      <div className="h-2 w-full rounded-full bg-white/15" />
                      <div className="h-2 w-5/6 rounded-full bg-white/15" />
                      <div className="h-2 w-4/6 rounded-full bg-white/15" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium text-white">{template.name}</div>
                    <div className="text-xs text-slate-400">Presentation theme</div>
                  </div>
                  <Pill tone={template.tag === "Pro" ? "amber" : "slate"}>
                    {template.tag === "Pro" ? <Crown className="mr-1 h-3 w-3" /> : null}
                    {template.tag}
                  </Pill>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="dashboard" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
        <Pill>Dashboard Preview</Pill>
        <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
          A dashboard that feels alive
        </h2>
        <p className="mt-4 max-w-2xl text-slate-400">
          Cleaner sections, recent history, quick stats, and upgrade prompts that actually look
          like product UI.
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Recent history</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Reopen saved presentations and continue where you left off.
                </p>
              </div>
              <Link href="/history" className="text-sm text-slate-300 transition hover:text-white">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {recentDecks.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 p-3"
                >
                  <div>
                    <div className="text-sm font-medium text-white">{item.title}</div>
                    <div className="text-xs text-slate-400">
                      {item.type} - {item.date}
                    </div>
                  </div>
                  <History className="h-4 w-4 text-slate-500" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-violet-400/20 bg-gradient-to-br from-violet-500/12 via-white/5 to-cyan-400/10 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">Plan usage</h3>
                  <p className="mt-2 text-sm text-slate-300">
                    {currentUser?.can_use_pro_features
                      ? "Unlimited generations unlocked."
                      : "Free accounts get 3 topic generations per day."}
                  </p>
                </div>
                <Pill>
                  {currentUser?.can_use_pro_features
                    ? "Unlimited"
                    : `${(plan?.daily_topic_limit ?? 3) -
                        (plan?.remaining_topic_generations ?? 3)} / ${plan?.daily_topic_limit ?? 3}`}
                </Pill>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300",
                    currentUser?.can_use_pro_features ? "w-full" : "w-2/3",
                  )}
                />
              </div>
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                <div className="mb-2 flex items-center gap-2 text-amber-100">
                  <Crown className="h-4 w-4" />
                  Upgrade to Pro
                </div>
                <p className="text-sm text-amber-50/90">
                  Unlock PDF to PPT, Notes to PPT, premium templates, and watermark-free export.
                </p>
                <CTA href="/pricing" className="mt-4 w-full">
                  Upgrade Now
                </CTA>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-semibold text-white">Quick stats</h3>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Presentations created", value: "1,248" },
                  { label: "Average export time", value: "18s" },
                  { label: "Premium templates", value: String(proTemplateCount) },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                  >
                    <div className="text-xs text-slate-400">{item.label}</div>
                    <div className="mt-1 text-2xl font-semibold text-white">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
        <div className="text-center">
          <Pill>Pricing</Pill>
          <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
            Start free, upgrade when the workflow deserves it
          </h2>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-7">
            <Pill>Free</Pill>
            <div className="mt-5 text-4xl font-semibold text-white">INR 0</div>
            <p className="mt-2 text-slate-400">For testing the core workflow</p>
            <div className="mt-6 space-y-3 text-sm text-slate-300">
              {[
                "Topic to PPT",
                "3 generations per day",
                `${freeTemplateCount} basic templates`,
                "Presentation history",
                "Watermark on export",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {item}
                </div>
              ))}
            </div>
            <CTA href={currentUser ? "/create" : "/login"} className="mt-6 w-full">
              Get Started
            </CTA>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-violet-400/30 bg-gradient-to-br from-violet-500/12 via-white/5 to-cyan-400/10 p-7 shadow-[0_20px_80px_-30px_rgba(139,92,246,0.55)]">
            <div className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-950">
              Most Popular
            </div>
            <Pill tone="amber">
              <Crown className="mr-1 h-3.5 w-3.5" />
              Pro
            </Pill>
            <div className="mt-5 text-4xl font-semibold text-white">
              INR 199<span className="text-base font-normal text-slate-400"> / month</span>
            </div>
            <p className="mt-2 text-slate-300">
              For premium presentation exports and unlimited workflow.
            </p>
            <div className="mt-6 space-y-3 text-sm text-slate-200">
              {[
                "Unlimited generations",
                "PDF to PPT",
                "Notes to PPT",
                `${proTemplateCount} premium templates`,
                "No watermark",
                "Priority export flow",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-cyan-300" />
                  {item}
                </div>
              ))}
            </div>
            <CTA href="/pricing" className="mt-6 w-full">
              {currentUser?.can_use_pro_features ? "Manage Pro Plan" : "Upgrade to Pro"}
            </CTA>
          </div>
        </div>
      </section>
    </div>
  );
}
