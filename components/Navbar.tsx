"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck2, Receipt, Truck, FileText, Clock } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import TransparentLogo from "./TransparentLogo";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0A090D]/90 backdrop-blur-xl border-b border-amber-900/10 dark:border-amber-500/20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 lg:gap-4">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-2.5 group shrink-0">
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center group-hover:scale-105 transition-all duration-300">
              <TransparentLogo
                src="/elyon-logo.jpeg"
                alt="Elyon Traders ET Monogram Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="whitespace-nowrap">
              <span className="text-base sm:text-lg lg:text-xl font-serif font-bold tracking-wider gold-text-gradient block leading-tight">
                ELYON TRADERS
              </span>
              <span className="text-[9px] sm:text-[10px] lg:text-[11px] block font-serif tracking-[0.2em] text-amber-700/80 dark:text-amber-300/80 font-medium">
                THE MOST HIGH
              </span>
            </div>
          </Link>

          {/* Main Navigation - Desktop & Laptops */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 font-serif overflow-x-auto no-scrollbar py-1">
            <Link
              href="/"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold tracking-wider whitespace-nowrap transition-all ${
                pathname === "/"
                  ? "bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-500/30 gold-text-gradient font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200 hover:bg-amber-500/5"
              }`}
            >
              <span>Home</span>
            </Link>

            <Link
              href="/attendance"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold tracking-wider whitespace-nowrap transition-all ${
                pathname.startsWith("/attendance")
                  ? "bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-500/30 gold-text-gradient font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200 hover:bg-amber-500/5"
              }`}
            >
              <CalendarCheck2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Attendance</span>
            </Link>

            <Link
              href="/billing"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold tracking-wider whitespace-nowrap transition-all ${
                pathname.startsWith("/billing")
                  ? "bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-500/30 gold-text-gradient font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200 hover:bg-amber-500/5"
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Billing & P&L</span>
            </Link>

            <Link
              href="/materials"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold tracking-wider whitespace-nowrap transition-all ${
                pathname.startsWith("/materials")
                  ? "bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-500/30 gold-text-gradient font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200 hover:bg-amber-500/5"
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Materials & Freight</span>
            </Link>

            <Link
              href="/splitter"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold tracking-wider whitespace-nowrap transition-all ${
                pathname.startsWith("/splitter")
                  ? "bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-500/30 gold-text-gradient font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200 hover:bg-amber-500/5"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Hours Splitter</span>
            </Link>

            <Link
              href="/transactions"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold tracking-wider whitespace-nowrap transition-all ${
                pathname.startsWith("/transactions")
                  ? "bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-500/30 gold-text-gradient font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200 hover:bg-amber-500/5"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Ledger & GST Bills</span>
            </Link>
          </nav>

          {/* Right Action: Isolated Theme Toggle */}
          <div className="flex items-center space-x-2 shrink-0 ml-auto md:ml-0 pl-3 border-l border-amber-500/20">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile Nav Tabs */}
      <div className="md:hidden flex border-t border-amber-900/10 dark:border-amber-500/20 bg-white/95 dark:bg-[#0A090D]/95 px-2 py-2 space-x-1 font-serif overflow-x-auto no-scrollbar">
        <Link
          href="/"
          className={`flex-1 min-w-[55px] text-center py-1.5 text-[11px] font-semibold tracking-wider whitespace-nowrap rounded-lg ${
            pathname === "/"
              ? "bg-amber-600 text-white font-bold"
              : "bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-slate-400"
          }`}
        >
          Home
        </Link>
        <Link
          href="/attendance"
          className={`flex-1 min-w-[75px] text-center py-1.5 text-[11px] font-semibold tracking-wider whitespace-nowrap rounded-lg ${
            pathname.startsWith("/attendance")
              ? "bg-amber-600 text-white font-bold"
              : "bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-slate-400"
          }`}
        >
          Attendance
        </Link>
        <Link
          href="/billing"
          className={`flex-1 min-w-[75px] text-center py-1.5 text-[11px] font-semibold tracking-wider whitespace-nowrap rounded-lg ${
            pathname.startsWith("/billing")
              ? "bg-amber-600 text-white font-bold"
              : "bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-slate-400"
          }`}
        >
          Billing
        </Link>
        <Link
          href="/materials"
          className={`flex-1 min-w-[85px] text-center py-1.5 text-[11px] font-semibold tracking-wider whitespace-nowrap rounded-lg ${
            pathname.startsWith("/materials")
              ? "bg-amber-600 text-white font-bold"
              : "bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-slate-400"
          }`}
        >
          Materials
        </Link>
        <Link
          href="/splitter"
          className={`flex-1 min-w-[95px] text-center py-1.5 text-[11px] font-semibold tracking-wider whitespace-nowrap rounded-lg ${
            pathname.startsWith("/splitter")
              ? "bg-amber-600 text-white font-bold"
              : "bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-slate-400"
          }`}
        >
          Hours Splitter
        </Link>
        <Link
          href="/transactions"
          className={`flex-1 min-w-[95px] text-center py-1.5 text-[11px] font-semibold tracking-wider whitespace-nowrap rounded-lg ${
            pathname.startsWith("/transactions")
              ? "bg-amber-600 text-white font-bold"
              : "bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-slate-400"
          }`}
        >
          GST Bills
        </Link>
      </div>
    </header>
  );
}
