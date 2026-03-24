import type { ReactNode } from "react";

type TagProps = {
  children: ReactNode;
  tone?: "cyan" | "lime" | "slate";
};

export function Tag({ children, tone = "slate" }: TagProps) {
  const palette = {
    cyan: "border-cyan/30 bg-cyan/12 text-cyan",
    lime: "border-lime/30 bg-lime/12 text-lime",
    slate: "border-white/12 bg-white/6 text-mist",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] ${palette[tone]}`}
    >
      {children}
    </span>
  );
}
