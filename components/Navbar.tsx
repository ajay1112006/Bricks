"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, CalendarCheck2, Receipt } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-lg border-b border-slate-200/80 dark:border-neutral-800/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <Layers className="w-5.5 h-5.5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  Bricks <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium">v1.0</span>
                </span>
                <span className="text-[11px] block text-slate-500 dark:text-slate-400 font-medium">Attendance & P&L Manager</span>
              </div>
            </Link>

            {/* Main Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                href="/attendance"
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith("/attendance") || pathname === "/"
                    ? "bg-slate-100 dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-neutral-800 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-900/60"
                }`}
              >
                <CalendarCheck2 className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <span>Attendance Tracker</span>
              </Link>
              <Link
                href="/billing"
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith("/billing")
                    ? "bg-slate-100 dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-neutral-800 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-900/60"
                }`}
              >
                <Receipt className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>Billing & Profit Monitor</span>
              </Link>
            </nav>
          </div>

          {/* Right Action: Theme Toggle */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile Nav Tabs */}
      <div className="md:hidden flex border-t border-slate-200 dark:border-neutral-800/80 bg-white/90 dark:bg-black/90 px-4 py-2 space-x-2">
        <Link
          href="/attendance"
          className={`flex-1 text-center py-2 text-xs font-medium rounded-lg ${
            pathname.startsWith("/attendance") || pathname === "/"
              ? "bg-blue-600 text-white"
              : "bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-slate-400"
          }`}
        >
          Attendance
        </Link>
        <Link
          href="/billing"
          className={`flex-1 text-center py-2 text-xs font-medium rounded-lg ${
            pathname.startsWith("/billing")
              ? "bg-blue-600 text-white"
              : "bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-slate-400"
          }`}
        >
          Billing & P&L
        </Link>
      </div>
    </header>
  );
}
