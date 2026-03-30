"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { workspaceNav } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function WorkspaceSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
      {workspaceNav.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "min-w-fit rounded-[1.1rem] border px-4 py-3 text-sm font-medium transition lg:w-full",
              isActive
                ? "border-cyan/30 bg-cyan/[0.12] text-white shadow-[0_12px_28px_rgba(90,217,255,0.12)]"
                : "border-white/8 bg-white/[0.03] text-mist hover:border-white/14 hover:bg-white/[0.06] hover:text-white",
            )}
          >
            <span className="hidden lg:inline">{item.label}</span>
            <span className="lg:hidden">{item.shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
