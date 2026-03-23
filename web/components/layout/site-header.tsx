import Link from "next/link";

import { buttonClasses } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";

const navigation = [
  { href: "#workflow", label: "Workflow" },
  { href: "#features", label: "Features" },
  { href: "#integrations", label: "Integrations" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/6 bg-night/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0accff_0%,#95ff70_100%)] text-sm font-black text-slate-950">
            AI
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-white">AI PPT Maker</p>
            <p className="text-xs tracking-[0.24em] text-mist uppercase">
              Student launch pad
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm text-mist transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <Tag tone="cyan">App Router</Tag>
        </nav>

        <Link href="#integrations" className={buttonClasses("secondary")}>
          View setup
        </Link>
      </div>
    </header>
  );
}
