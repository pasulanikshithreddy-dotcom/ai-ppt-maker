"use client";

import Link from "next/link";
import { Menu, Presentation, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useApp } from "@/components/providers/app-provider";
import { marketingNav } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const { authStatus, currentUser, signOut } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuthenticated = authStatus === "authenticated" && currentUser;

  async function handleSignOut() {
    try {
      await signOut();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_30px_rgba(139,92,246,0.35)]">
            <Presentation className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-white">AI PPT Maker</p>
            <p className="text-xs text-slate-400">Premium presentation generator</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {marketingNav.map((item) => {
            const isHashLink = item.href.startsWith("/#");
            const isActive = isHashLink ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "text-sm transition",
                  isActive ? "text-white" : "text-slate-300 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-200">
                {currentUser.plan_code}
              </span>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Open app
              </Link>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                onClick={() => void handleSignOut()}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Start Free
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10 md:hidden"
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-white/10 bg-slate-950/95 px-5 py-4 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            {marketingNav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-xl px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}
                >
                  Open app
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    setMenuOpen(false);
                    void handleSignOut();
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                  onClick={() => setMenuOpen(false)}
                >
                  Start Free
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
