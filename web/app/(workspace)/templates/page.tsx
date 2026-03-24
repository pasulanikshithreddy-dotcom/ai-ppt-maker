"use client";

import Link from "next/link";

import { useApp } from "@/components/providers/app-provider";
import { buttonClasses } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { Panel } from "@/components/ui/panel";
import { StatusBanner } from "@/components/ui/status-banner";

export default function TemplatesPage() {
  const { currentUser, plan, templates, templatesError, templatesLoading } = useApp();
  const isPaid = currentUser?.can_use_pro_features ?? plan?.is_paid ?? false;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Templates"
        title="Browse styles that feel polished before the first export."
        description="Browse the live template catalog from the backend, see which designs are premium, and pick what your current plan can actually use."
      />

      {templatesError ? (
        <StatusBanner title="Template catalog unavailable" description={templatesError} tone="danger" />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templatesLoading ? (
          <Panel>
            <p className="text-sm text-mist">Loading templates...</p>
          </Panel>
        ) : null}
        {templates.map((template, index) => (
          <Panel key={template.id} className="overflow-hidden p-0">
            <div
              className="h-36 w-full"
              style={{
                background:
                  index % 2 === 0
                    ? "linear-gradient(135deg, rgba(10,204,255,0.28), rgba(149,255,112,0.18))"
                    : "linear-gradient(135deg, rgba(255,189,83,0.2), rgba(10,204,255,0.16))",
              }}
            />
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold text-white">{template.name}</h2>
                <span className="rounded-full border border-white/12 px-3 py-1 text-xs uppercase tracking-[0.2em] text-mist">
                  {template.is_pro ? "Pro" : "Free"}
                </span>
              </div>
              <p className="mt-2 text-sm text-cyan">
                {template.theme.font_family} • {template.layout.cover_style}
              </p>
              <p className="mt-4 text-sm leading-7 text-mist">{template.description}</p>
              <div className="mt-4 flex items-center justify-between gap-3 text-sm text-white/85">
                <span>
                  {template.layout.content_columns} columns • {template.theme.title_font_size}px title
                </span>
                <span>{template.layout.show_page_numbers ? "Page numbers" : "Clean slides"}</span>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3">
                <Link href="/create" className={buttonClasses("secondary")}>
                  Use in Create
                </Link>
                {template.is_pro && !isPaid ? (
                  <Link href="/pricing" className="text-sm font-medium text-cyan">
                    Upgrade for access
                  </Link>
                ) : (
                  <span className="text-sm text-lime">Available now</span>
                )}
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
