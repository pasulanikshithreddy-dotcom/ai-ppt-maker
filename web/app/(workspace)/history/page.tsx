"use client";

import { useEffect } from "react";
import Link from "next/link";

import { useApp } from "@/components/providers/app-provider";
import { buttonClasses } from "@/components/ui/button";
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
        title="Every saved deck should stay easy to find, inspect, and download."
        description="Use history as a real archive, not a forgotten log. Open old presentations, review outline summaries, and pull the download link back without digging through chat or files."
        actions={
          <>
            <button type="button" className={buttonClasses("secondary")} onClick={() => void refresh()}>
              Refresh
            </button>
            <Link href="/create" className={buttonClasses("primary")}>
              Create another deck
            </Link>
          </>
        }
      />

      {error ? (
        <StatusBanner title="History request failed" description={error} tone="danger" />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-cyan">Saved presentations</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-white">
                Your deck archive
              </h2>
            </div>
            <span className="data-chip">{items.length} total</span>
          </div>

          <div className="mt-5 grid gap-3">
            {loading ? <p className="text-sm text-mist">Loading presentation history...</p> : null}
            {!loading && items.length === 0 ? (
              <div className="surface-inset rounded-[1.4rem] p-4 text-sm leading-7 text-mist">
                Your history is empty right now. Generate a deck from Topic, Notes, or PDF and it
                will show up here automatically.
              </div>
            ) : null}

            {items.map((item) => {
              const isSelected = selectedPresentation?.id === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void selectPresentation(item.id)}
                  className={`rounded-[1.4rem] border p-4 text-left transition ${
                    isSelected
                      ? "border-cyan/30 bg-cyan/[0.08]"
                      : "border-white/8 bg-white/[0.03] hover:border-white/14 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-white">{item.title}</h3>
                      <p className="mt-1 text-sm text-mist">
                        {item.template_name ?? item.template_id}
                      </p>
                    </div>
                    <span className="data-chip">{item.status}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-sm text-white/85">
                    <span className="data-chip">{item.source_type.toUpperCase()}</span>
                    <span className="data-chip">{item.slide_count} slides</span>
                    <span className="data-chip">
                      {item.watermark_applied ? "Watermarked" : "No watermark"}
                    </span>
                    <span className="data-chip">
                      {new Intl.DateTimeFormat("en-IN", {
                        dateStyle: "medium",
                      }).format(new Date(item.created_at))}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <p className="eyebrow text-lime">Preview summary</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">
            {selectedPresentation?.title ?? "Choose a saved deck"}
          </h2>

          {detailLoading ? <p className="mt-5 text-sm text-mist">Loading preview...</p> : null}

          {!detailLoading && !selectedPresentation ? (
            <div className="surface-inset mt-5 rounded-[1.4rem] p-4 text-sm leading-7 text-mist">
              Select a presentation from the left to inspect the saved outline, metadata, and
              download link.
            </div>
          ) : null}

          {selectedPresentation ? (
            <div className="mt-5 space-y-4">
              <div className="preview-grid">
                <div className="surface-inset rounded-[1.3rem] p-4 text-sm text-white/90">
                  Mode: {selectedPresentation.source_type.toUpperCase()}
                </div>
                <div className="surface-inset rounded-[1.3rem] p-4 text-sm text-white/90">
                  Slides: {selectedPresentation.slide_count}
                </div>
                <div className="surface-inset rounded-[1.3rem] p-4 text-sm text-white/90">
                  Template: {selectedPresentation.template_name ?? selectedPresentation.template_id}
                </div>
                <div className="surface-inset rounded-[1.3rem] p-4 text-sm text-white/90">
                  Watermark: {selectedPresentation.watermark_applied ? "Applied" : "Removed"}
                </div>
              </div>

              <div className="surface-inset rounded-[1.4rem] p-4">
                <p className="eyebrow text-cyan">Outline preview</p>
                <div className="mt-4 space-y-2">
                  {selectedPresentation.content_preview.map((item) => (
                    <div
                      key={item}
                      className="rounded-[1rem] border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-white/90"
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
                  className={buttonClasses("primary")}
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
