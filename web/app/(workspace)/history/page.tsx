"use client";

import { useEffect } from "react";

import { useApp } from "@/components/providers/app-provider";
import { PageHero } from "@/components/ui/page-hero";
import { Panel } from "@/components/ui/panel";
import { StatusBanner } from "@/components/ui/status-banner";
import { usePresentationHistory } from "@/hooks/use-presentation-history";

export default function HistoryPage() {
  const { accessToken } = useApp();
  const {
    detailLoading,
    error,
    items,
    loading,
    refresh,
    selectPresentation,
    selectedPresentation,
  } = usePresentationHistory(accessToken);

  useEffect(() => {
    if (!selectedPresentation && items[0]) {
      void selectPresentation(items[0].id);
    }
  }, [items, selectPresentation, selectedPresentation]);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="History"
        title="Keep every draft, revision, and export within reach."
        description="Review saved presentations, inspect preview summaries, and reopen download links without hunting through old tabs."
      />

      {error ? (
        <StatusBanner title="History request failed" description={error} tone="danger" />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan">Saved presentations</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-white">
                Your deck archive
              </h2>
            </div>
            <button
              type="button"
              className="text-sm text-mist hover:text-white"
              onClick={() => void refresh()}
            >
              Refresh
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            {loading ? <p className="text-sm text-mist">Loading presentation history...</p> : null}
            {!loading && items.length === 0 ? (
              <div className="surface-inset rounded-[1.5rem] p-4 text-sm text-mist">
                Your history is empty right now. Generate a deck from Topic, Notes, or PDF to
                see it appear here.
              </div>
            ) : null}
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void selectPresentation(item.id)}
                className="surface-inset rounded-[1.5rem] p-4 text-left transition hover:border-cyan/20 hover:bg-cyan/[0.04]"
              >
                <div className="grid gap-3 md:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr] md:items-center">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-white">{item.title}</h2>
                    <p className="mt-1 text-sm text-mist">
                      {item.template_name ?? item.template_id}
                    </p>
                  </div>
                  <p className="text-sm text-white/90">
                    {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
                      new Date(item.created_at),
                    )}
                  </p>
                  <p className="text-sm text-cyan">{item.source_type.toUpperCase()}</p>
                  <div className="text-sm text-lime">
                    {item.watermark_applied ? "Watermarked" : "No watermark"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel>
          <p className="text-xs uppercase tracking-[0.22em] text-lime">Preview summary</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">
            {selectedPresentation?.title ?? "Choose a saved deck"}
          </h2>

          {detailLoading ? <p className="mt-5 text-sm text-mist">Loading preview...</p> : null}

          {!detailLoading && !selectedPresentation ? (
            <div className="surface-inset mt-5 rounded-[1.5rem] p-4 text-sm text-mist">
              Select a presentation from the left to inspect its preview summary and download
              link.
            </div>
          ) : null}

          {selectedPresentation ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="surface-inset rounded-[1.5rem] p-4 text-sm text-white/90">
                  Mode: {selectedPresentation.source_type.toUpperCase()}
                </div>
                <div className="surface-inset rounded-[1.5rem] p-4 text-sm text-white/90">
                  Slides: {selectedPresentation.slide_count}
                </div>
                <div className="surface-inset rounded-[1.5rem] p-4 text-sm text-white/90">
                  Template: {selectedPresentation.template_name ?? selectedPresentation.template_id}
                </div>
                <div className="surface-inset rounded-[1.5rem] p-4 text-sm text-white/90">
                  Watermark: {selectedPresentation.watermark_applied ? "Applied" : "Removed"}
                </div>
              </div>

              <div className="surface-inset rounded-[1.5rem] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan">Outline preview</p>
                <div className="mt-3 space-y-2">
                  {selectedPresentation.content_preview.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-white/90"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {selectedPresentation.file_url ? (
                <a
                  href={selectedPresentation.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full bg-cyan px-5 py-3 text-sm font-semibold text-slate-950"
                >
                  Download PPTX
                </a>
              ) : null}
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
