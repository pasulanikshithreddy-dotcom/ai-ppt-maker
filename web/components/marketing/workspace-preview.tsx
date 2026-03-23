import { SectionHeading } from "@/components/ui/section-heading";

type WorkspacePreviewProps = {
  steps: Array<{
    title: string;
    description: string;
    accent: string;
  }>;
};

export function WorkspacePreview({ steps }: WorkspacePreviewProps) {
  return (
    <section id="workflow" className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
      <SectionHeading
        eyebrow="Workflow"
        title="A clean app-router structure for the full presentation journey."
        description="The landing page is already split into reusable sections so you can grow this into auth, dashboard, template gallery, and generation routes without collapsing the codebase into one giant page file."
      />

      <div className="surface-card rounded-[2rem] p-6">
        <div className="grid gap-4">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="grid gap-4 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4 sm:grid-cols-[auto_1fr]"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl font-display text-lg font-semibold text-slate-950"
                style={{ background: step.accent }}
              >
                {index + 1}
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-mist">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
