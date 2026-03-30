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

const createModes: Array<{
  id: CreateMode;
  title: string;
  summary: string;
  access: "Free" | "Pro";
}> = [
  {
    id: "topic",
    title: "Topic to PPT",
    summary: "Best when you know the idea and want the app to shape the first structure.",
    access: "Free",
  },
  {
    id: "notes",
    title: "Notes to PPT",
    summary: "Best when you already have rough notes or talking points and need them cleaned up.",
    access: "Pro",
  },
  {
    id: "pdf",
    title: "PDF to PPT",
    summary: "Best when the source already exists in a document and you want a condensed deck draft.",
    access: "Pro",
  },
];

const suggestedTopics = [
  "Machine learning evaluation metrics",
  "Climate policy debate summary",
  "Startup pitch for a campus app",
  "Operating systems memory management",
];

function formatTemplateColor(color: string) {
  return color.startsWith("#") ? color : `#${color}`;
}

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

  const activeModeConfig = createModes.find((mode) => mode.id === activeMode) ?? createModes[0];
  const isLockedMode = activeMode !== "topic" && !isPaid;
  const topicLimitReached =
    activeMode === "topic" &&
    !isPaid &&
    remainingTopicGenerations != null &&
    remainingTopicGenerations <= 0;

  const inputSummary = useMemo(() => {
    if (activeMode === "topic") {
      return {
        source: topic.trim() || "No topic entered yet",
        slides: topicSlideCount,
        tone,
      };
    }

    if (activeMode === "notes") {
      return {
        source: notesTitle.trim() || notesTopic.trim() || "Untitled notes draft",
        slides: notesSlideCount,
        tone: "notes cleanup",
      };
    }

    return {
      source: pdfFile?.name ?? "No PDF selected yet",
      slides: pdfSlideCount,
      tone: "document summary",
    };
  }, [
    activeMode,
    notesSlideCount,
    notesTitle,
    notesTopic,
    pdfFile?.name,
    pdfSlideCount,
    tone,
    topic,
    topicSlideCount,
  ]);

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

  function validateInputs() {
    if (!accessToken || !currentUser) {
      return "Sign in before generating a presentation.";
    }

    if (!selectedTemplate) {
      return "Choose a template before generating.";
    }

    if (selectedTemplate.is_pro && !isPaid) {
      return `Template "${selectedTemplate.name}" is available only on the Pro plan.`;
    }

    if (activeMode !== "topic" && !isPaid) {
      return `${activeMode.toUpperCase()} to PPT is available only on the Pro plan.`;
    }

    if (topicLimitReached) {
      return "You've used today's free Topic-to-PPT quota. Upgrade to Pro for unlimited generations.";
    }

    if (activeMode === "topic" && !topic.trim()) {
      return "Add a topic before generating.";
    }

    if (activeMode === "notes" && !notes.trim()) {
      return "Paste your notes before generating.";
    }

    if (activeMode === "pdf" && !pdfFile) {
      return "Upload a PDF before generating.";
    }

    return null;
  }

  async function handleGenerate() {
    const validationMessage = validateInputs();
    if (validationMessage) {
      if (validationMessage.toLowerCase().includes("pro")) {
        setError(null);
        setUpgradePrompt(validationMessage);
      } else {
        setUpgradePrompt(null);
        setError(validationMessage);
      }
      return;
    }

    if (!selectedTemplate || !currentUser || !accessToken) {
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
        response = await generatePdf(accessToken, {
          pdf: pdfFile as File,
          slide_count: pdfSlideCount,
          user_id: currentUser.id,
          template_id: selectedTemplate.id,
        });
      }

      setResult(response.data);
      await refreshAccount();
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Generation failed.";
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
        title="Create a deck from the source you actually have."
        description="This should be the main working surface: choose a mode, set the inputs, pick a template, preview the direction, and generate without guessing what happens next."
        actions={
          <>
            <span className="data-chip">{plan?.current_plan.name ?? "Free"} plan</span>
            <span className="data-chip">
              {remainingTopicGenerations == null
                ? "Unlimited topic generations"
                : `${remainingTopicGenerations} topic generations left`}
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
      {error ? <StatusBanner title="Generation failed" description={error} tone="danger" /> : null}
      {upgradePrompt ? (
        <StatusBanner
          title="Upgrade needed"
          description={upgradePrompt}
          tone="warning"
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <Panel>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow text-cyan">Generation mode</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-white">
                  Choose the workflow
                </h2>
              </div>
              <span className="data-chip">{activeModeConfig.access}</span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {createModes.map((mode) => {
                const locked = mode.id !== "topic" && !isPaid;

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => handleModeChange(mode.id)}
                    className={`rounded-[1.35rem] border p-4 text-left transition ${
                      activeMode === mode.id
                        ? "border-cyan/30 bg-cyan/[0.08]"
                        : "border-white/8 bg-white/[0.03] hover:border-white/14 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-display text-lg font-semibold text-white">{mode.title}</h3>
                      <span className="data-chip">{locked ? "Locked" : mode.access}</span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-mist">{mode.summary}</p>
                  </button>
                );
              })}
            </div>

            <div className="soft-divider my-6" />

            {activeMode === "topic" ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-mist">
                    Topic
                    <input
                      type="text"
                      value={topic}
                      onChange={(event) => setTopic(event.target.value)}
                      placeholder="Machine learning evaluation metrics"
                      className="form-control mt-2"
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {suggestedTopics.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        className="data-chip text-left normal-case tracking-normal"
                        onClick={() => setTopic(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm text-mist">
                    Subject
                    <input
                      type="text"
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      className="form-control mt-2"
                    />
                  </label>
                  <label className="block text-sm text-mist">
                    Tone
                    <select
                      value={tone}
                      onChange={(event) => setTone(event.target.value)}
                      className="form-control mt-2"
                    >
                      <option value="focused">Focused</option>
                      <option value="confident">Confident</option>
                      <option value="friendly">Friendly</option>
                    </select>
                  </label>
                </div>

                <label className="block text-sm text-mist">
                  Slide count
                  <select
                    value={topicSlideCount}
                    onChange={(event) => setTopicSlideCount(Number(event.target.value))}
                    className="form-control mt-2"
                  >
                    {[6, 8, 10, 12, 14].map((count) => (
                      <option key={count} value={count}>
                        {count} slides
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            {activeMode === "notes" ? (
              <div className="space-y-5">
                <label className="block text-sm text-mist">
                  Optional title
                  <input
                    type="text"
                    value={notesTitle}
                    onChange={(event) => setNotesTitle(event.target.value)}
                    placeholder="Customer research summary"
                    className="form-control mt-2"
                  />
                </label>

                <label className="block text-sm text-mist">
                  Optional topic
                  <input
                    type="text"
                    value={notesTopic}
                    onChange={(event) => setNotesTopic(event.target.value)}
                    placeholder="Customer research"
                    className="form-control mt-2"
                  />
                </label>

                <label className="block text-sm text-mist">
                  Notes
                  <textarea
                    rows={9}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Paste your class notes, brainstorm, or rough research summary here."
                    className="form-control mt-2 min-h-[220px] resize-y"
                  />
                </label>

                <label className="block text-sm text-mist">
                  Slide count
                  <select
                    value={notesSlideCount}
                    onChange={(event) => setNotesSlideCount(Number(event.target.value))}
                    className="form-control mt-2"
                  >
                    {[6, 8, 10, 12, 14].map((count) => (
                      <option key={count} value={count}>
                        {count} slides
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            {activeMode === "pdf" ? (
              <div className="space-y-5">
                <label className="block text-sm text-mist">
                  Upload PDF
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
                    className="form-control mt-2 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                  />
                </label>

                <label className="block text-sm text-mist">
                  Slide count
                  <select
                    value={pdfSlideCount}
                    onChange={(event) => setPdfSlideCount(Number(event.target.value))}
                    className="form-control mt-2"
                  >
                    {[6, 8, 10, 12].map((count) => (
                      <option key={count} value={count}>
                        {count} slides
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            {isLockedMode ? (
              <div className="surface-inset mt-6 rounded-[1.45rem] p-4">
                <p className="text-sm leading-7 text-white/90">
                  This workflow is locked on Free. Upgrade to Pro to use Notes to PPT, PDF to PPT,
                  premium templates, and watermark-free exports.
                </p>
                <Link href="/pricing" className={`${buttonClasses("primary")} mt-4`}>
                  Upgrade to Pro
                </Link>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className={buttonClasses("primary")}
                onClick={() => void handleGenerate()}
                disabled={generating || !accessToken || !currentUser}
              >
                {generating ? "Generating..." : "Generate presentation"}
              </button>
              <Link href="/pricing" className={buttonClasses("secondary")}>
                View plan options
              </Link>
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow text-lime">Template library</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-white">
                  Pick a slide style before you generate
                </h2>
              </div>
              <span className="data-chip">
                {selectedTemplate ? selectedTemplate.name : "No template"}
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {templatesLoading ? <p className="text-sm text-mist">Loading templates...</p> : null}
              {templates.map((template) => {
                const colors = [
                  formatTemplateColor(template.theme.primary_color),
                  formatTemplateColor(template.theme.secondary_color),
                ];

                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className={`rounded-[1.35rem] border p-4 text-left transition ${
                      selectedTemplateId === template.id
                        ? "border-cyan/30 bg-cyan/[0.08]"
                        : "border-white/8 bg-white/[0.03] hover:border-white/14 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-semibold text-white">
                          {template.name}
                        </h3>
                        <p className="mt-1 text-sm text-mist">{template.theme.font_family}</p>
                      </div>
                      <span className="data-chip">{template.is_pro ? "Pro" : "Free"}</span>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      {colors.map((color) => (
                        <span
                          key={color}
                          className="h-5 w-5 rounded-full border border-white/10"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    <p className="mt-4 text-sm leading-7 text-mist">{template.description}</p>
                    <p className="mt-3 text-sm text-white/85">
                      {template.layout.cover_style} / {template.layout.content_columns} column layout
                    </p>
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel>
            <p className="eyebrow text-cyan">Deck brief</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white">
              Your current generation setup
            </h2>

            <div className="preview-grid mt-5">
              <div className="surface-inset rounded-[1.3rem] p-4">
                <p className="text-sm text-mist">Mode</p>
                <p className="mt-2 font-display text-xl text-white">{activeModeConfig.title}</p>
              </div>
              <div className="surface-inset rounded-[1.3rem] p-4">
                <p className="text-sm text-mist">Slides</p>
                <p className="mt-2 font-display text-xl text-white">{inputSummary.slides}</p>
              </div>
              <div className="surface-inset rounded-[1.3rem] p-4 md:col-span-2">
                <p className="text-sm text-mist">Source</p>
                <p className="mt-2 text-sm leading-7 text-white/90">{inputSummary.source}</p>
              </div>
              <div className="surface-inset rounded-[1.3rem] p-4 md:col-span-2">
                <p className="text-sm text-mist">Generation style</p>
                <p className="mt-2 text-sm leading-7 text-white/90">{inputSummary.tone}</p>
              </div>
            </div>
          </Panel>

          <Panel>
            <p className="eyebrow text-lime">Template preview</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white">
              {selectedTemplate?.name ?? "Choose a template"}
            </h2>

            {!selectedTemplate ? (
              <p className="mt-4 text-sm leading-7 text-mist">
                Select a template to preview its fonts, colors, and layout details.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="surface-inset rounded-[1.4rem] p-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-6 w-6 rounded-full border border-white/10"
                      style={{
                        backgroundColor: formatTemplateColor(selectedTemplate.theme.primary_color),
                      }}
                    />
                    <span
                      className="h-6 w-6 rounded-full border border-white/10"
                      style={{
                        backgroundColor: formatTemplateColor(selectedTemplate.theme.secondary_color),
                      }}
                    />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-mist">
                    {selectedTemplate.description}
                  </p>
                </div>

                <div className="preview-grid">
                  <div className="surface-inset rounded-[1.3rem] p-4">
                    <p className="text-sm text-mist">Font family</p>
                    <p className="mt-2 text-white">{selectedTemplate.theme.font_family}</p>
                  </div>
                  <div className="surface-inset rounded-[1.3rem] p-4">
                    <p className="text-sm text-mist">Title size</p>
                    <p className="mt-2 text-white">{selectedTemplate.theme.title_font_size}px</p>
                  </div>
                  <div className="surface-inset rounded-[1.3rem] p-4">
                    <p className="text-sm text-mist">Body size</p>
                    <p className="mt-2 text-white">{selectedTemplate.theme.body_font_size}px</p>
                  </div>
                  <div className="surface-inset rounded-[1.3rem] p-4">
                    <p className="text-sm text-mist">Layout</p>
                    <p className="mt-2 text-white">
                      {selectedTemplate.layout.cover_style} / {selectedTemplate.layout.content_columns} column
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Panel>

          <Panel>
            <p className="eyebrow text-cyan">Output preview</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white">
              {result ? "Generated presentation" : "Nothing generated yet"}
            </h2>

            {!result ? (
              <div className="surface-inset mt-5 rounded-[1.4rem] p-4 text-sm leading-7 text-mist">
                Generate a deck to preview the title, slide outline, watermark status, and
                download link here.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-white">
                    {result.content?.presentation_title ?? result.presentation.title}
                  </h3>
                  <p className="mt-2 text-sm text-mist">
                    {result.presentation.source_type.toUpperCase()} /{" "}
                    {result.presentation.template_name ?? result.presentation.template_id}
                  </p>
                </div>

                <div className="preview-grid">
                  <div className="surface-inset rounded-[1.3rem] p-4 text-sm text-white/90">
                    Slides: {result.presentation.slide_count}
                  </div>
                  <div className="surface-inset rounded-[1.3rem] p-4 text-sm text-white/90">
                    Watermark: {result.presentation.watermark_applied ? "Applied" : "Removed"}
                  </div>
                </div>

                <div className="space-y-3">
                  {(result.content?.slides ?? []).map((slide, index) => (
                    <div
                      key={`${slide.title}-${index}`}
                      className="surface-inset rounded-[1.3rem] p-4"
                    >
                      <p className="font-semibold text-white">
                        {index + 1}. {slide.title}
                      </p>
                      <ul className="mt-3 space-y-1 text-sm text-mist">
                        {slide.bullets.map((bullet) => (
                          <li key={bullet}>- {bullet}</li>
                        ))}
                      </ul>
                      {slide.speaker_notes ? (
                        <p className="mt-3 text-sm leading-7 text-white/85">
                          Notes: {slide.speaker_notes}
                        </p>
                      ) : null}
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
          </Panel>
        </div>
      </div>
    </div>
  );
}
