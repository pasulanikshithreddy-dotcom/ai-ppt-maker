"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  type GenerationResult,
  type TemplateDefinition,
  generateNotes,
  generatePdf,
  generateTopic,
} from "@/lib/api/backend";
import { useApp } from "@/components/providers/app-provider";
import { buttonClasses } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { Panel } from "@/components/ui/panel";
import { StatusBanner } from "@/components/ui/status-banner";

type CreateMode = "topic" | "notes" | "pdf";

const createModes = [
  {
    id: "topic" as const,
    title: "Topic to PPT",
    description: "Start from a prompt and let AI outline the deck structure.",
  },
  {
    id: "notes" as const,
    title: "Notes to PPT",
    description: "Turn class notes or brainstorms into structured slides.",
  },
  {
    id: "pdf" as const,
    title: "PDF to PPT",
    description: "Summarize uploaded PDFs into a clean presentation draft.",
  },
];

export default function CreatePage() {
  const {
    accessToken,
    currentUser,
    plan,
    refreshAccount,
    templates,
    templatesError,
    templatesLoading,
  } = useApp();
  const [activeMode, setActiveMode] = useState<CreateMode>("topic");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("Study");
  const [tone, setTone] = useState("focused");
  const [topicSlideCount, setTopicSlideCount] = useState(8);
  const [notes, setNotes] = useState("");
  const [notesTitle, setNotesTitle] = useState("");
  const [notesTopic, setNotesTopic] = useState("");
  const [notesSlideCount, setNotesSlideCount] = useState(10);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfSlideCount, setPdfSlideCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradePrompt, setUpgradePrompt] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const isPaid = currentUser?.can_use_pro_features ?? plan?.is_paid ?? false;
  const remainingTopicGenerations = plan?.remaining_topic_generations;

  useEffect(() => {
    if (!selectedTemplateId && templates.length > 0) {
      const nextTemplate =
        templates.find((item) => (isPaid ? true : !item.is_pro)) ?? templates[0];
      setSelectedTemplateId(nextTemplate.id);
    }
  }, [isPaid, selectedTemplateId, templates]);

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  const isLockedMode = activeMode !== "topic" && !isPaid;
  const topicLimitReached =
    activeMode === "topic" &&
    !isPaid &&
    remainingTopicGenerations != null &&
    remainingTopicGenerations <= 0;

  function handleModeChange(nextMode: CreateMode) {
    setActiveMode(nextMode);
    setError(null);
    if (nextMode !== "topic" && !isPaid) {
      setUpgradePrompt(`${nextMode.toUpperCase()} to PPT is available only on the Pro plan.`);
      return;
    }
    setUpgradePrompt(null);
  }

  function handleTemplateSelect(template: TemplateDefinition) {
    if (template.is_pro && !isPaid) {
      setUpgradePrompt(`Template "${template.name}" is available only on the Pro plan.`);
      return;
    }
    setSelectedTemplateId(template.id);
    setUpgradePrompt(null);
  }

  async function handleGenerate() {
    if (!accessToken || !currentUser) {
      setError("Sign in before generating a presentation.");
      return;
    }

    if (!selectedTemplate) {
      setError("Choose a template before generating.");
      return;
    }

    if (selectedTemplate.is_pro && !isPaid) {
      setUpgradePrompt(`Template "${selectedTemplate.name}" is available only on the Pro plan.`);
      return;
    }

    if (activeMode !== "topic" && !isPaid) {
      setUpgradePrompt(`${activeMode.toUpperCase()} to PPT is available only on the Pro plan.`);
      return;
    }

    if (topicLimitReached) {
      setUpgradePrompt(
        "You've used today's free Topic-to-PPT quota. Upgrade to Pro for unlimited generations.",
      );
      return;
    }

    setGenerating(true);
    setError(null);
    setUpgradePrompt(null);

    try {
      let response;

      if (activeMode === "topic") {
        response = await generateTopic(accessToken, {
          topic,
          subject,
          tone,
          slide_count: topicSlideCount,
          user_id: currentUser.id,
          template_id: selectedTemplate.id,
        });
      } else if (activeMode === "notes") {
        response = await generateNotes(accessToken, {
          notes,
          title: notesTitle || undefined,
          topic: notesTopic || undefined,
          slide_count: notesSlideCount,
          user_id: currentUser.id,
          template_id: selectedTemplate.id,
        });
      } else {
        if (!pdfFile) {
          throw new Error("Upload a PDF before generating.");
        }

        response = await generatePdf(accessToken, {
          pdf: pdfFile,
          slide_count: pdfSlideCount,
          user_id: currentUser.id,
          template_id: selectedTemplate.id,
        });
      }

      setResult(response.data);
      await refreshAccount();
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : "Generation failed.";
      setError(message);
      if (message.toLowerCase().includes("pro")) {
        setUpgradePrompt(message);
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Create"
        title="Build the next deck draft from topic, notes, or a source PDF."
        description="Switch between Topic, Notes, and PDF generation, choose a live template from the backend catalog, and preview the structured result before downloading."
      />

      {templatesError ? (
        <StatusBanner
          title="Template catalog unavailable"
          description={templatesError}
          tone="danger"
        />
      ) : null}
      {error ? <StatusBanner title="Generation failed" description={error} tone="danger" /> : null}
      {upgradePrompt ? (
        <StatusBanner
          title="Upgrade to unlock this flow"
          description={upgradePrompt}
          tone="warning"
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan">Generator</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">Draft setup</h2>
          <p className="mt-2 text-sm text-mist">
            {plan?.remaining_topic_generations == null
              ? "Unlimited generations are available on your current plan."
              : `${plan.remaining_topic_generations} topic generations left today on Free.`}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {createModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleModeChange(mode.id)}
                className={`surface-inset rounded-[1.5rem] p-4 text-left transition ${
                  activeMode === mode.id ? "border-cyan/30 bg-cyan/[0.08]" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg font-semibold text-white">{mode.title}</h3>
                  {mode.id !== "topic" ? (
                    <span className="rounded-full border border-white/12 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-mist">
                      Pro
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-7 text-mist">{mode.description}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4">
            {activeMode === "topic" ? (
              <>
                <label className="text-sm text-mist">
                  Topic
                  <input
                    type="text"
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="Machine learning evaluation metrics"
                    className="surface-inset mt-2 w-full rounded-2xl px-4 py-3 text-white outline-none transition focus:border-cyan/30"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-mist">
                    Subject
                    <input
                      type="text"
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      className="surface-inset mt-2 w-full rounded-2xl px-4 py-3 text-white outline-none transition focus:border-cyan/30"
                    />
                  </label>
                  <label className="text-sm text-mist">
                    Tone
                    <select
                      value={tone}
                      onChange={(event) => setTone(event.target.value)}
                      className="surface-inset mt-2 w-full rounded-2xl px-4 py-3 text-white outline-none"
                    >
                      <option value="focused">Focused</option>
                      <option value="confident">Confident</option>
                      <option value="friendly">Friendly</option>
                    </select>
                  </label>
                </div>
                <label className="text-sm text-mist">
                  Slide count
                  <select
                    value={topicSlideCount}
                    onChange={(event) => setTopicSlideCount(Number(event.target.value))}
                    className="surface-inset mt-2 w-full rounded-2xl px-4 py-3 text-white outline-none"
                  >
                    {[6, 8, 10, 12, 14].map((count) => (
                      <option key={count} value={count}>
                        {count} slides
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}

            {activeMode === "notes" ? (
              <>
                <label className="text-sm text-mist">
                  Optional title
                  <input
                    type="text"
                    value={notesTitle}
                    onChange={(event) => setNotesTitle(event.target.value)}
                    placeholder="Customer research summary"
                    className="surface-inset mt-2 w-full rounded-2xl px-4 py-3 text-white outline-none transition focus:border-cyan/30"
                  />
                </label>
                <label className="text-sm text-mist">
                  Optional topic
                  <input
                    type="text"
                    value={notesTopic}
                    onChange={(event) => setNotesTopic(event.target.value)}
                    placeholder="Customer research"
                    className="surface-inset mt-2 w-full rounded-2xl px-4 py-3 text-white outline-none transition focus:border-cyan/30"
                  />
                </label>
                <label className="text-sm text-mist">
                  Notes
                  <textarea
                    rows={8}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Paste your class notes, brainstorm, or rough research summary here."
                    className="surface-inset mt-2 w-full rounded-[1.5rem] px-4 py-3 text-white outline-none transition focus:border-cyan/30"
                  />
                </label>
                <label className="text-sm text-mist">
                  Slide count
                  <select
                    value={notesSlideCount}
                    onChange={(event) => setNotesSlideCount(Number(event.target.value))}
                    className="surface-inset mt-2 w-full rounded-2xl px-4 py-3 text-white outline-none"
                  >
                    {[6, 8, 10, 12, 14].map((count) => (
                      <option key={count} value={count}>
                        {count} slides
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}

            {activeMode === "pdf" ? (
              <>
                <label className="text-sm text-mist">
                  Upload PDF
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
                    className="surface-inset mt-2 w-full rounded-2xl px-4 py-3 text-white outline-none transition focus:border-cyan/30 file:mr-4 file:rounded-full file:border-0 file:bg-cyan file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
                  />
                </label>
                <label className="text-sm text-mist">
                  Slide count
                  <select
                    value={pdfSlideCount}
                    onChange={(event) => setPdfSlideCount(Number(event.target.value))}
                    className="surface-inset mt-2 w-full rounded-2xl px-4 py-3 text-white outline-none"
                  >
                    {[6, 8, 10, 12].map((count) => (
                      <option key={count} value={count}>
                        {count} slides
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}
          </div>

          {isLockedMode ? (
            <div className="surface-inset mt-5 rounded-[1.5rem] p-4">
              <p className="text-sm text-white/90">
                This workflow is locked on Free. Upgrade to Pro to use Notes to PPT, PDF to
                PPT, premium templates, and watermark-free exports.
              </p>
              <Link href="/pricing" className={`${buttonClasses("primary")} mt-4`}>
                Upgrade to Pro
              </Link>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className={buttonClasses("primary")}
              onClick={() => void handleGenerate()}
              disabled={
                generating ||
                !accessToken ||
                !currentUser ||
                isLockedMode ||
                Boolean(selectedTemplate?.is_pro && !isPaid)
              }
            >
              {generating ? "Generating..." : "Generate presentation"}
            </button>
            <Link href="/pricing" className={buttonClasses("secondary")}>
              View plan options
            </Link>
          </div>
        </Panel>

        <Panel>
          <p className="text-xs uppercase tracking-[0.22em] text-lime">Template pick</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-white">Choose a style</h2>
          <div className="mt-5 space-y-3">
            {templatesLoading ? <p className="text-sm text-mist">Loading templates...</p> : null}
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleTemplateSelect(template)}
                className={`surface-inset w-full rounded-[1.5rem] p-4 text-left transition ${
                  selectedTemplateId === template.id ? "border-cyan/30 bg-cyan/[0.08]" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-xl font-semibold text-white">{template.name}</h3>
                  <span className="rounded-full border border-white/12 px-3 py-1 text-xs uppercase tracking-[0.2em] text-mist">
                    {template.is_pro ? "Pro" : "Free"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-mist">
                  {template.theme.font_family} • {template.layout.cover_style}
                </p>
                <p className="mt-3 text-sm leading-7 text-white/85">{template.description}</p>
                {template.is_pro && !isPaid ? (
                  <p className="mt-3 text-sm text-cyan">
                    Upgrade to unlock this premium template.
                  </p>
                ) : null}
              </button>
            ))}
          </div>

          <div className="surface-inset mt-5 rounded-[1.5rem] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan">Preview panel</p>
            {!result ? (
              <p className="mt-3 text-sm leading-7 text-mist">
                Generate a presentation to preview the title, slide outline, watermark status,
                and download link here.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-white">
                    {result.content?.presentation_title ?? result.presentation.title}
                  </h3>
                  <p className="mt-2 text-sm text-mist">
                    {result.presentation.source_type.toUpperCase()} •{" "}
                    {result.presentation.template_name}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-sm text-white/90">
                    Slides: {result.presentation.slide_count}
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-sm text-white/90">
                    Watermark: {result.presentation.watermark_applied ? "Applied" : "Removed"}
                  </div>
                </div>
                <div className="space-y-2">
                  {(result.content?.slides ?? []).map((slide, index) => (
                    <div
                      key={`${slide.title}-${index}`}
                      className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-3"
                    >
                      <p className="text-sm font-semibold text-white">
                        {index + 1}. {slide.title}
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-mist">
                        {slide.bullets.map((bullet) => (
                          <li key={bullet}>• {bullet}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {result.presentation.file_url ? (
                  <a
                    href={result.presentation.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonClasses("primary")}
                  >
                    Download PPTX
                  </a>
                ) : null}
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
