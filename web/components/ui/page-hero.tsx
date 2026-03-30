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
    <div className="surface-card relative overflow-hidden rounded-[2rem] p-6 md:p-7">
      <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(90,217,255,0.18),transparent_60%)] lg:block" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="eyebrow text-cyan">{eyebrow}</p>
          <h1 className="mt-3 text-balance font-display text-3xl font-semibold text-white sm:text-4xl xl:text-[2.9rem]">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-mist sm:text-base">
            {description}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}
