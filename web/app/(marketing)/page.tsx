import Link from "next/link";

import { buttonClasses } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Tag } from "@/components/ui/tag";

const workflows = [
  {
    title: "Topic to PPT",
    description:
      "Drop in a topic, subject, tone, and target slide count. The app returns a structured draft with title, bullets, and speaker notes.",
    badge: "Free",
  },
  {
    title: "Notes to PPT",
    description:
      "Paste lecture notes, raw research, or rough talking points and turn them into a usable deck structure instead of a wall of text.",
    badge: "Pro",
  },
  {
    title: "PDF to PPT",
    description:
      "Upload a source PDF, extract readable text, summarize it, and generate a presentation draft with export-ready output.",
    badge: "Pro",
  },
];

const valueProps = [
  "Built for fast student workflow, not generic corporate slides",
  "Templates, history, and plan limits stay tied to your account",
  "Create, preview, and download from one focused workspace",
];

const appMoments = [
  {
    title: "Start a deck quickly",
    body: "Open Create, choose Topic, Notes, or PDF, and build a first draft without jumping between tools.",
  },
  {
    title: "Pick the right template",
    body: "See which themes are free or premium before you generate, with colors and type choices visible up front.",
  },
  {
    title: "Come back later",
    body: "Use History to reopen saved presentations, inspect summaries, and download old exports when you need them.",
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="grid gap-8 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-16">
        <div className="max-w-3xl">
          <div className="mb-5 flex flex-wrap gap-3">
            <Tag tone="cyan">Topic, Notes, PDF</Tag>
            <Tag tone="lime">Student-first UX</Tag>
            <Tag>Export-ready PPTX</Tag>
          </div>

          <h1 className="text-balance font-display text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Turn messy ideas into presentation drafts you can actually use.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-mist">
            AI PPT Maker is a focused web workspace for generating decks from a topic, class
            notes, or source PDFs, then reviewing structure, templates, history, and downloads in
            one place.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/create" className={buttonClasses("primary")}>
              Open create workspace
            </Link>
            <Link href="/pricing" className={buttonClasses("secondary")}>
              Compare free vs Pro
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {valueProps.map((item) => (
              <div key={item} className="surface-inset rounded-[1.3rem] px-4 py-4">
                <p className="text-sm leading-7 text-white/90">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <Panel className="mesh-panel overflow-hidden rounded-[2rem]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow text-cyan">Live workflow</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-white">
                What the app is meant to feel like
              </h2>
            </div>
            <span className="data-chip text-cyan">Focused mode</span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Create a new deck</p>
                <span className="data-chip">8 slides</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-mist">
                Topic: Machine learning evaluation metrics
              </p>
              <p className="text-sm leading-7 text-mist">Mode: Topic to PPT</p>
              <p className="text-sm leading-7 text-mist">Template: Academic Clean</p>
            </div>

            <div className="preview-grid">
              <div className="rounded-[1.3rem] border border-cyan/20 bg-cyan/[0.08] p-4">
                <p className="eyebrow text-cyan">Preview</p>
                <p className="mt-3 text-sm leading-7 text-white/90">
                  Title, outline, bullets, and speaker notes appear before export.
                </p>
              </div>
              <div className="rounded-[1.3rem] border border-lime/20 bg-lime/[0.08] p-4">
                <p className="eyebrow text-lime">History</p>
                <p className="mt-3 text-sm leading-7 text-white/90">
                  Saved decks stay attached to your account with template and watermark status.
                </p>
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
              <div className="flex items-center justify-between text-sm text-mist">
                <span>Ready for export</span>
                <span>PPTX download available</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[82%] rounded-full bg-[linear-gradient(90deg,#5ad9ff_0%,#a7f36b_100%)]" />
              </div>
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {workflows.map((workflow) => (
          <Panel key={workflow.title} className="h-full">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-2xl font-semibold text-white">{workflow.title}</p>
              <span className="data-chip">{workflow.badge}</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-mist">{workflow.description}</p>
          </Panel>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div>
          <p className="eyebrow text-cyan">How it works</p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-white">
            A clearer workflow than copy-pasting into random slide tools.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-mist">
            The product is structured around the work users actually do: create a draft, choose a
            style, check the output, save the result, and return to it later.
          </p>
        </div>

        <div className="grid gap-4">
          {appMoments.map((moment, index) => (
            <div
              key={moment.title}
              className="surface-card grid gap-4 rounded-[1.6rem] p-5 sm:grid-cols-[auto_1fr]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#5ad9ff_0%,#a7f36b_100%)] font-display text-lg font-semibold text-slate-950">
                {index + 1}
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-white">{moment.title}</h3>
                <p className="mt-2 text-sm leading-7 text-mist">{moment.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
