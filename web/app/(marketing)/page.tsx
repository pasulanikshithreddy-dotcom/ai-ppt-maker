import { FeatureGrid } from "@/components/marketing/feature-grid";
import { HeroSection } from "@/components/marketing/hero-section";
import { IntegrationStatus } from "@/components/marketing/integration-status";
import { WorkspacePreview } from "@/components/marketing/workspace-preview";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPublicEnvStatus } from "@/lib/env";
import { coreFeatures, workflowSteps } from "@/lib/site-config";

export default function LandingPage() {
  const envStatus = getPublicEnvStatus();

  return (
    <>
      <HeroSection />
      <WorkspacePreview steps={workflowSteps} />
      <FeatureGrid items={coreFeatures} />

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionHeading
          eyebrow="Student-ready SaaS"
          title="Everything important visible at a glance."
          description="The main pages are now structured so students can move from sign-in to deck generation, template selection, history review, and plan upgrades without losing context."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Panel>
            <p className="text-xs uppercase tracking-[0.22em] text-lime">Fast entry</p>
            <h3 className="mt-4 font-display text-2xl font-semibold text-white">Dashboard-first workflow</h3>
            <p className="mt-3 text-sm leading-7 text-mist">
              Core destinations like create, templates, history, and profile already exist, so the landing page can funnel straight into product usage instead of placeholder dead ends.
            </p>
          </Panel>
          <Panel>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan">Responsive shell</p>
            <h3 className="mt-4 font-display text-2xl font-semibold text-white">Built for laptops and cramped screens</h3>
            <p className="mt-3 text-sm leading-7 text-mist">
              Public marketing sections, auth, and workspace views all scale down cleanly with stacked cards and mobile-friendly navigation.
            </p>
          </Panel>
        </div>
      </section>

      <IntegrationStatus envStatus={envStatus} />
    </>
  );
}
