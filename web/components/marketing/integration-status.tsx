import { SectionHeading } from "@/components/ui/section-heading";

type EnvStatus = {
  apiBaseUrl: string;
  backendReady: boolean;
  supabaseReady: boolean;
  missingKeys: string[];
};

type IntegrationStatusProps = {
  envStatus: EnvStatus;
};

const cards = [
  {
    title: "Supabase Auth placeholder",
    file: "lib/supabase/client.ts",
    description:
      "A browser client helper is ready so sign-in, session, and magic-link flows can be attached without rebuilding the app shell.",
  },
  {
    title: "Backend API placeholder",
    file: "lib/api/backend.ts",
    description:
      "Typed request helpers are set up for templates, topic generation, profile reads, and plan-aware endpoints from the FastAPI backend.",
  },
];

export function IntegrationStatus({ envStatus }: IntegrationStatusProps) {
  return (
    <section id="integrations" className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <SectionHeading
        eyebrow="Integrations"
        title="Environment-ready placeholders for auth and API wiring."
        description="You can plug in real Supabase credentials and the backend base URL through `NEXT_PUBLIC_*` variables without changing the component tree."
      />

      <div className="grid gap-4">
        <div className="surface-card rounded-[2rem] p-6">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill label="Backend API" ready={envStatus.backendReady} />
            <StatusPill label="Supabase Auth" ready={envStatus.supabaseReady} />
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-mist">API base URL</p>
            <p className="mt-2 font-mono text-sm text-white">{envStatus.apiBaseUrl}</p>
            <p className="mt-3 text-sm text-mist">
              {envStatus.missingKeys.length === 0
                ? "All public integration variables are configured."
                : `Missing variables: ${envStatus.missingKeys.join(", ")}`}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <article key={card.title} className="surface-card rounded-[1.75rem] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-lime">{card.file}</p>
              <h3 className="mt-4 font-display text-2xl font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-mist">{card.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatusPill({ label, ready }: { label: string; ready: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] ${
        ready
          ? "border-lime/30 bg-lime/12 text-lime"
          : "border-white/12 bg-white/6 text-mist"
      }`}
    >
      {label}: {ready ? "ready" : "pending env"}
    </span>
  );
}
