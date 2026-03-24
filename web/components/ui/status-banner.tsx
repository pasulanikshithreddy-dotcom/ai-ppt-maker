import { cn } from "@/lib/utils";

type StatusBannerTone = "info" | "success" | "warning" | "danger";

export function StatusBanner({
  title,
  description,
  tone = "info",
  className,
}: {
  title: string;
  description?: string;
  tone?: StatusBannerTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border px-4 py-3",
        tone === "info" && "border-cyan/20 bg-cyan/[0.08] text-cyan",
        tone === "success" && "border-lime/20 bg-lime/[0.08] text-lime",
        tone === "warning" && "border-amber-300/20 bg-amber-300/[0.08] text-amber-200",
        tone === "danger" && "border-rose-300/20 bg-rose-300/[0.08] text-rose-200",
        className,
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      {description ? <p className="mt-1 text-sm text-white/85">{description}</p> : null}
    </div>
  );
}
