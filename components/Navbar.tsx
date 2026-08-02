"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarCheck2, Receipt, Truck, Clock, FileText } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import TransparentLogo from "./TransparentLogo";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: Home, exact: true },
    { name: "Attendance", href: "/attendance", icon: CalendarCheck2 },
    { name: "Billing", href: "/billing", icon: Receipt },
    { name: "Materials", href: "/materials", icon: Truck },
    { name: "Splitter", href: "/splitter", icon: Clock },
    { name: "Ledger", href: "/transactions", icon: FileText },
  ];

  const isActive = (item: typeof navItems[0]) => {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0A090D]/90 backdrop-blur-xl border-b border-amber-900/10 dark:border-amber-500/20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-1.5 lg:gap-3">
          {/* Logo & Brand */}
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

          {/* Main Navigation - Desktop & Laptops (Fits all 6 buttons simultaneously) */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 font-serif shrink">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1 px-2 py-1.5 lg:px-3 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold tracking-wide whitespace-nowrap transition-all ${
                    active
                      ? "bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-500/30 gold-text-gradient font-bold shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200 hover:bg-amber-500/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Isolated Theme Toggle */}
          <div className="flex items-center space-x-2 shrink-0 ml-auto md:ml-0 pl-2 sm:pl-3 border-l border-amber-500/20">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile Nav Bar - 6-column grid (All 6 buttons visible on screen at once) */}
      <div className="md:hidden border-t border-amber-900/10 dark:border-amber-500/20 bg-white/95 dark:bg-[#0A090D]/95 px-1 py-1.5">
        <div className="grid grid-cols-6 gap-1 text-center font-serif">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-all ${
                  active
                    ? "bg-amber-600 text-white font-bold shadow"
                    : "bg-slate-100 dark:bg-neutral-900/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 mb-0.5 ${active ? "text-white" : "text-amber-600 dark:text-amber-400"}`} />
                <span className="text-[9px] leading-none tracking-tight font-semibold truncate max-w-full">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
