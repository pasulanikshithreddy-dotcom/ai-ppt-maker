import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="surface-card flex flex-col gap-5 rounded-[1.75rem] p-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan">{eyebrow}</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-mist sm:text-base">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
