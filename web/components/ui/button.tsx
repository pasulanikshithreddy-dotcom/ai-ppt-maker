import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

export function buttonClasses(variant: ButtonVariant = "primary") {
  return cn(
    "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-night",
    variant === "primary" &&
      "bg-cyan text-slate-950 shadow-glow hover:-translate-y-0.5 hover:bg-[#55dcff]",
    variant === "secondary" &&
      "border border-white/12 bg-white/6 text-white hover:-translate-y-0.5 hover:bg-white/10",
    variant === "ghost" &&
      "text-mist hover:bg-white/6 hover:text-white",
  );
}
