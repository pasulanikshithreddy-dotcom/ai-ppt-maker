"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useApp } from "@/components/providers/app-provider";
import { buttonClasses } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { marketingNav } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const { authStatus, currentUser, signOut } = useApp();
  const isAuthenticated = authStatus === "authenticated" && currentUser;

  async function handleSignOut() {
    try {
      await signOut();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/6 bg-night/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#5ad9ff_0%,#a7f36b_100%)] text-sm font-black text-slate-950">
            AI
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-white">AI PPT Maker</p>
            <p className="text-xs uppercase tracking-[0.24em] text-mist">
              AI presentation workspace
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {marketingNav.map((item) => {
            const isActive = item.href === pathname || pathname.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "text-sm transition",
                  isActive ? "text-white" : "text-mist hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Tag tone="lime">Web app</Tag>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Tag tone="cyan">{currentUser.plan_code.toUpperCase()}</Tag>
              <Link href="/dashboard" className={buttonClasses("secondary")}>
                Open app
              </Link>
              <button type="button" className={buttonClasses("ghost")} onClick={handleSignOut}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonClasses("ghost")}>
                Login
              </Link>
              <Link href="/pricing" className={buttonClasses("secondary")}>
                View pricing
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
