import { FeatureGrid } from "@/components/marketing/feature-grid";
import { HeroSection } from "@/components/marketing/hero-section";
import { IntegrationStatus } from "@/components/marketing/integration-status";
import { WorkspacePreview } from "@/components/marketing/workspace-preview";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getPublicEnvStatus } from "@/lib/env";
import { coreFeatures, workflowSteps } from "@/lib/site-config";

export default function HomePage() {
  const envStatus = getPublicEnvStatus();

  return (
    <div className="min-h-screen bg-night text-white">
      <div className="absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(circle_at_top,rgba(10,204,255,0.20),transparent_40%),radial-gradient(circle_at_30%_20%,rgba(149,255,112,0.14),transparent_25%),linear-gradient(180deg,#08111f_0%,#050914_55%,#03060d_100%)]" />
      <div className="absolute inset-0 -z-10 bg-grid bg-[size:28px_28px] opacity-[0.08]" />

      <SiteHeader />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-5 pb-20 pt-6 sm:px-8 lg:px-10">
        <HeroSection />
        <WorkspacePreview steps={workflowSteps} />
        <FeatureGrid items={coreFeatures} />
        <IntegrationStatus envStatus={envStatus} />
      </main>

      <SiteFooter />
    </div>
  );
}
