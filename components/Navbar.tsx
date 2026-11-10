"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import TransparentLogo from "./TransparentLogo";

// Attendance, Billing, Materials, Splitter & Ledger are password-protected
// and reachable only through the Admin hub (see /admin + middleware.ts).
const ADMIN_PATHS = [
  "/admin",
  "/attendance",
  "/billing",
  "/materials",
  "/splitter",
  "/transactions",
];

export default function Navbar() {
  const pathname = usePathname();

  // The Admin button lights up inside the hub and while inside any protected module.
  const isAdminActive = ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0A090D]/90 backdrop-blur-xl border-b border-amber-900/10 dark:border-amber-500/20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-1.5 lg:gap-3">
          {/* Logo & Brand (doubles as the home link) */}
          <Link href="/" className="flex items-center space-x-2 group shrink-0">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center group-hover:scale-105 transition-all duration-300">
              <TransparentLogo
                src="/elyon-logo.jpeg"
                alt="Elyon Traders ET Monogram Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="whitespace-nowrap">
              <span className="text-sm sm:text-base lg:text-xl font-serif font-bold tracking-wider gold-text-gradient block leading-tight">
                ELYON TRADERS
              </span>
              <span className="text-[8px] sm:text-[9px] lg:text-[11px] block font-serif tracking-[0.2em] text-amber-700/80 dark:text-amber-300/80 font-medium">
                THE MOST HIGH
              </span>
            </div>
          </Link>

          {/* Right Corner: Admin hub + Theme toggle */}
          <div className="flex items-center space-x-2 shrink-0 ml-auto pl-2 sm:pl-3 border-l border-amber-500/20">
            <Link
              href="/admin"
              className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 lg:py-2 rounded-lg font-serif text-[11px] lg:text-sm font-semibold tracking-wide whitespace-nowrap transition-all border ${
                isAdminActive
                  ? "bg-amber-500/10 text-amber-900 dark:text-amber-200 border-amber-500/30 gold-text-gradient font-bold shadow-sm"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200 hover:bg-amber-500/5"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Admin</span>
            </Link>

            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
