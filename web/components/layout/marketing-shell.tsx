import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export function MarketingShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="page-grid min-h-screen text-white">
      <div className="absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(circle_at_top,rgba(90,217,255,0.18),transparent_38%),radial-gradient(circle_at_22%_18%,rgba(167,243,107,0.12),transparent_24%)]" />
      <div className="absolute inset-0 -z-10 bg-grid bg-[size:28px_28px] opacity-[0.08]" />
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-5 pb-24 pt-8 sm:px-8 lg:px-10">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
