"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, CalendarCheck2, Receipt } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import TransparentLogo from "./TransparentLogo";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-white/70 dark:bg-[#0A090D]/80 backdrop-blur-xl border-b border-amber-900/10 dark:border-amber-500/20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center group-hover:scale-105 transition-all duration-300">
                <TransparentLogo
                  src="/elyon-logo.jpeg"
                  alt="Elyon Traders ET Monogram Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-serif font-bold tracking-wider gold-text-gradient block leading-tight">
                  ELYON TRADERS
                </span>
                <span className="text-[10px] sm:text-[11px] block font-serif tracking-[0.25em] text-amber-700/80 dark:text-amber-300/80 font-medium">
                  THE MOST HIGH
                </span>
              </div>
            </Link>

            {/* Main Navigation */}
            <nav className="hidden md:flex items-center space-x-1 font-serif">
              <Link
                href="/"
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold tracking-wider transition-all ${
                  pathname === "/"
                    ? "bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-500/30 gold-text-gradient font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200 hover:bg-amber-500/5"
                }`}
              >
                <span>Home</span>
              </Link>
              <Link
                href="/attendance"
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold tracking-wider transition-all ${
                  pathname.startsWith("/attendance")
                    ? "bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-500/30 gold-text-gradient font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200 hover:bg-amber-500/5"
                }`}
              >
                <CalendarCheck2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Attendance Tracker</span>
              </Link>
              <Link
                href="/billing"
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold tracking-wider transition-all ${
                  pathname.startsWith("/billing")
                    ? "bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-500/30 gold-text-gradient font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200 hover:bg-amber-500/5"
                }`}
              >
                <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Billing & P&L</span>
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
      <div className="md:hidden flex border-t border-amber-900/10 dark:border-amber-500/20 bg-white/90 dark:bg-[#0A090D]/90 px-3 py-2 space-x-1.5 font-serif">
        <Link
          href="/"
          className={`flex-1 text-center py-1.5 text-xs font-semibold tracking-wider rounded-lg ${
            pathname === "/"
              ? "bg-amber-600 text-white font-bold"
              : "bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-slate-400"
          }`}
        >
          Home
        </Link>
        <Link
          href="/attendance"
          className={`flex-1 text-center py-1.5 text-xs font-semibold tracking-wider rounded-lg ${
            pathname.startsWith("/attendance")
              ? "bg-amber-600 text-white font-bold"
              : "bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-slate-400"
          }`}
        >
          Attendance
        </Link>
        <Link
          href="/billing"
          className={`flex-1 text-center py-1.5 text-xs font-semibold tracking-wider rounded-lg ${
            pathname.startsWith("/billing")
              ? "bg-amber-600 text-white font-bold"
              : "bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-slate-400"
          }`}
        >
          Billing & P&L
        </Link>
      </div>
    </header>
  );
}
