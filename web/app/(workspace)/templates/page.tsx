"use client";

import Link from "next/link";

import { useApp } from "@/components/providers/app-provider";
import { buttonClasses } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { Panel } from "@/components/ui/panel";
import { StatusBanner } from "@/components/ui/status-banner";

function formatTemplateColor(color: string) {
  return color.startsWith("#") ? color : `#${color}`;
}

export default function TemplatesPage() {
  const { currentUser, plan, templates, templatesError, templatesLoading } = useApp();
  const isPaid = currentUser?.can_use_pro_features ?? plan?.is_paid ?? false;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Templates"
        title="Choose a template that matches the kind of deck you are trying to present."
        description="The template gallery should help a user decide quickly: what is free, what is premium, what the typography feels like, and how the slides will look before generation."
        actions={
          <>
            <span className="data-chip">{templates.length} templates</span>
            <span className="data-chip">
              {isPaid ? "Premium access unlocked" : "Free plan template access"}
            </span>
          </>
        }
      />

      {templatesError ? (
        <StatusBanner
          title="Template catalog unavailable"
          description={templatesError}
          tone="danger"
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templatesLoading ? (
          <Panel>
            <p className="text-sm text-mist">Loading templates...</p>
          </Panel>
        ) : null}

        {templates.map((template) => {
          const locked = template.is_pro && !isPaid;

          return (
            <Panel key={template.id} className="overflow-hidden p-0">
              <div
                className="h-36 w-full"
                style={{
                  background: `linear-gradient(135deg, ${formatTemplateColor(
                    template.theme.primary_color,
                  )}33, ${formatTemplateColor(template.theme.secondary_color)}aa)`,
                }}
              />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-white">
                      {template.name}
                    </h2>
                    <p className="mt-2 text-sm text-mist">{template.theme.font_family}</p>
                  </div>
                  <span className="data-chip">{template.is_pro ? "Pro" : "Free"}</span>
                </div>

                <p className="mt-4 text-sm leading-7 text-mist">{template.description}</p>

                <div className="mt-5 flex items-center gap-2">
                  <span
                    className="h-5 w-5 rounded-full border border-white/10"
                    style={{ backgroundColor: formatTemplateColor(template.theme.primary_color) }}
                  />
                  <span
                    className="h-5 w-5 rounded-full border border-white/10"
                    style={{ backgroundColor: formatTemplateColor(template.theme.secondary_color) }}
                  />
                  <span className="text-sm text-white/85">
                    {template.layout.cover_style} / {template.layout.content_columns} column
                  </span>
                </div>

                <div className="mt-5 preview-grid">
                  <div className="surface-inset rounded-[1.1rem] p-3 text-sm text-white/90">
                    Title size: {template.theme.title_font_size}px
                  </div>
                  <div className="surface-inset rounded-[1.1rem] p-3 text-sm text-white/90">
                    Body size: {template.theme.body_font_size}px
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <Link href="/create" className={buttonClasses("secondary")}>
                    Use in Create
                  </Link>
                  {locked ? (
                    <Link href="/pricing" className="text-sm font-medium text-cyan">
                      Upgrade for access
                    </Link>
                  ) : (
                    <span className="text-sm text-lime">Available now</span>
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
