"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CalendarCheck2,
  Clock,
  FileText,
  Home,
  Loader2,
  LogOut,
  Receipt,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { handleCardMouseMove } from "@/lib/useSpotlight";

const MODULES = [
  {
    id: "01",
    name: "Attendance",
    href: "/attendance",
    icon: CalendarCheck2,
    blurb: "4 daily sessions, employee mark-in, weekly team register & day-wise reports.",
    tag: "4 Daily Sessions",
  },
  {
    id: "02",
    name: "Billing",
    href: "/billing",
    icon: Receipt,
    blurb: "Order book, P&L calibration, margins & real-time profit insights.",
    tag: "Order P&L",
  },
  {
    id: "03",
    name: "Materials",
    href: "/materials",
    icon: Truck,
    blurb: "Raw material purchases, truck freight logs & vendor dues.",
    tag: "Freight & Stock",
  },
  {
    id: "04",
    name: "Splitter",
    href: "/splitter",
    icon: Clock,
    blurb: "Hours rent & labor wage splitter with printable party slips.",
    tag: "Wage Allocator",
  },
  {
    id: "05",
    name: "Ledger",
    href: "/transactions",
    icon: FileText,
    blurb: "Financial ledger, customer dues, GST bills & Excel export.",
    tag: "GST & Dues",
  },
] as const;

export default function AdminDashboard() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.replace("/admin");
      router.refresh();
    }
  };

  return (
    <div className="space-y-8 py-4 sm:py-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-amber-900/20 via-amber-600/10 to-transparent p-6 rounded-3xl border border-amber-500/30 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authenticated Admin Session</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold gold-text-gradient">
            Admin Control Panel
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Attendance, Billing, Materials, Splitter &amp; Ledger — every restricted module lives here.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Link
            href="/"
            className="flex-1 md:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-white/60 dark:bg-black/40 border border-amber-500/30 hover:border-amber-500/60 text-slate-700 dark:text-amber-200 text-xs sm:text-sm font-semibold transition-all"
          >
            <Home className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Home</span>
          </Link>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex-1 md:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-rose-600/20 transition-all disabled:opacity-60"
          >
            {signingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Restricted Modules */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {MODULES.map((module) => {
          const Icon = module.icon;
          return (
            <div
              key={module.href}
              onMouseMove={handleCardMouseMove}
              className="glass-panel glass-panel-hover p-5 lg:p-6 rounded-3xl flex flex-col justify-between border-amber-500/20 dark:border-amber-500/30"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-5">
                  <Icon className="w-6 h-6" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-semibold">
                      Module {module.id}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {module.tag}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100">
                    {module.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {module.blurb}
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200/60 dark:border-slate-800/80">
                <Link
                  href={module.href}
                  className="inline-flex items-center justify-between w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-amber-600/20 transition-all group whitespace-nowrap gap-1"
                >
                  <span className="whitespace-nowrap">Open {module.name}</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}

        {/* Session note */}
        <div className="glass-panel p-5 lg:p-6 rounded-3xl flex flex-col justify-center items-start border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-amber-100">
            Session Secured
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Your admin session stays valid for 7 days. Signing out — or changing the
            <span className="font-mono font-bold text-amber-700 dark:text-amber-300"> ADMIN_PASSWORD </span>
            environment variable — locks these modules again immediately.
          </p>
        </div>
      </section>
    </div>
  );
}
