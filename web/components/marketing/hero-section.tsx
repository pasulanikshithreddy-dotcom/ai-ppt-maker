import Link from "next/link";

import { buttonClasses } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";

const heroHighlights = [
  "Topic to deck in minutes",
  "Notes and PDF workflows queued",
  "Supabase auth and FastAPI hooks prepared",
];

export function HeroSection() {
  return (
    <section className="grid gap-8 pt-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:pt-16">
      <div className="max-w-3xl">
        <div className="mb-5 flex flex-wrap gap-3">
          <Tag tone="cyan">Dark mode default</Tag>
          <Tag tone="lime">Built for students</Tag>
          <Tag>Solo developer friendly</Tag>
        </div>

        <h1 className="text-balance font-display text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
          Build smarter slides with a workspace that feels like late-night focus mode.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-mist">
          This web app scaffold gives AI PPT Maker a sharp, dark, student-friendly launch surface
          with clean sections for auth, deck generation, templates, and backend integrations.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="#workflow" className={buttonClasses("primary")}>
            Explore the workflow
          </Link>
          <Link href="#integrations" className={buttonClasses("secondary")}>
            Check integration status
          </Link>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {heroHighlights.map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-sm text-white/90">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="surface-card mesh-panel accent-ring animate-pulse-soft rounded-[2rem] p-5 lg:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-cyan">Draft Lab</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white">
              Final exam deck sprint
            </h2>
          </div>
          <div className="rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-lime">
            04 min
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-3xl border border-white/8 bg-white/6 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-mist">Prompt</p>
            <p className="mt-2 text-base text-white">
              Create a concise revision deck on machine learning evaluation metrics.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/8 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-mist">Template</p>
              <p className="mt-2 font-display text-xl text-white">Night Scholar</p>
              <p className="mt-2 text-sm text-mist">High-contrast slides for classroom screens.</p>
            </div>

            <div className="rounded-3xl border border-cyan/20 bg-cyan/8 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan">Output</p>
              <p className="mt-2 font-display text-xl text-white">12 slide study deck</p>
              <p className="mt-2 text-sm text-mist">Bullets, notes, and PPT export pipeline ready.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
            <div className="flex items-center justify-between text-sm text-mist">
              <span>Slide energy</span>
              <span>Focused + visual</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[78%] rounded-full bg-[linear-gradient(90deg,#0accff_0%,#95ff70_100%)]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
