import { SectionHeading } from "@/components/ui/section-heading";

type FeatureItem = {
  title: string;
  description: string;
  accentLabel: string;
};

type FeatureGridProps = {
  items: FeatureItem[];
};

export function FeatureGrid({ items }: FeatureGridProps) {
  return (
    <section id="features" className="space-y-8">
      <SectionHeading
        eyebrow="Design system"
        title="Modern, dark, and student-friendly from the first screen."
        description="The visual language leans into contrast, neon accents, big type, and focused panels so the product feels built for study sessions, project submissions, and fast presentation prep."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <article
            key={item.title}
            className="surface-card rounded-[1.75rem] p-5 transition duration-200 hover:-translate-y-1 hover:border-cyan/25"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-cyan">{item.accentLabel}</p>
            <h3 className="mt-4 font-display text-2xl font-semibold text-white">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-mist">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
