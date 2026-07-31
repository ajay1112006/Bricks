"use client";

import Link from "next/link";
import { CalendarCheck2, Receipt, Phone, Mail, ArrowRight, ShieldCheck, Sparkles, Building2 } from "lucide-react";
import { handleCardMouseMove } from "@/lib/useSpotlight";
import TransparentLogo from "@/components/TransparentLogo";
import SparkleGoldTitle from "@/components/SparkleGoldTitle";

export default function HomePage() {
  return (
    <div className="space-y-12 py-4 sm:py-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-4xl mx-auto px-4">
        {/* Pure Seamless Transparent Monogram Logo */}
        <div className="inline-flex items-center justify-center mb-2 group">
          <div className="w-36 h-36 sm:w-52 sm:h-52 md:w-60 md:h-60 flex items-center justify-center group-hover:scale-105 transition-all duration-300">
            <TransparentLogo
              src="/elyon-logo.jpeg"
              alt="Elyon Traders ET Monogram Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-2">
          <SparkleGoldTitle text="ELYON TRADERS" />
          <p className="text-sm sm:text-base font-serif tracking-[0.35em] text-amber-700 dark:text-amber-300/90 uppercase font-semibold">
            THE MOST HIGH
          </p>
        </div>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-sans">
          Official enterprise operations & financial intelligence hub. Streamlined daily 4-session employee attendance tracking and real-time order P&L profit calibration.
        </p>
      </section>

      {/* Official Details & Contact Card (from Elyon details.jpeg) */}
      <section className="max-w-4xl mx-auto px-4">
        <div
          onMouseMove={handleCardMouseMove}
          className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-amber-500/30 dark:border-amber-500/30 shadow-2xl"
        >
          {/* Subtle Ambient Gold Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            {/* Left: Contact Info */}
            <div className="space-y-4 text-left w-full md:w-1/2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                <Building2 className="w-3.5 h-3.5" />
                <span>Official Business Contact</span>
              </div>

              <div>
                <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-amber-100">
                  Elyon Traders Details
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Get in touch with our enterprise operations team.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <a
                  href="tel:+919566957474"
                  className="flex items-center space-x-3 p-3 rounded-xl bg-white/60 dark:bg-black/40 border border-amber-500/20 hover:border-amber-500/50 hover:bg-white/80 dark:hover:bg-black/60 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Phone Number</span>
                    <span className="text-sm font-mono font-bold text-slate-900 dark:text-amber-200">+91 9566957474</span>
                  </div>
                </a>

                <a
                  href="mailto:elyontraderss@gmail.com"
                  className="flex items-center space-x-3 p-3 rounded-xl bg-white/60 dark:bg-black/40 border border-amber-500/20 hover:border-amber-500/50 hover:bg-white/80 dark:hover:bg-black/60 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Official Email</span>
                    <span className="text-sm font-mono font-bold text-slate-900 dark:text-amber-200">elyontraderss@gmail.com</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Right: Business Card Image Showcase */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center">
              <div className="relative group rounded-2xl overflow-hidden border border-amber-500/30 shadow-xl p-1 bg-gradient-to-tr from-amber-500/20 via-amber-200/10 to-transparent">
                <img
                  src="/Elyon.jpeg"
                  alt="Elyon Traders Official Brand Card"
                  className="w-full max-w-sm h-auto rounded-xl object-contain shadow-md transition-transform duration-300 group-hover:scale-102"
                />
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-serif tracking-widest mt-3">
                ELYON TRADERS • OFFICIAL BRAND IDENTITY
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Module Navigation Cards */}
      <section className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module 1: Attendance Tracker */}
        <div
          onMouseMove={handleCardMouseMove}
          className="glass-panel glass-panel-hover p-6 sm:p-8 rounded-3xl flex flex-col justify-between border-amber-500/20 dark:border-amber-500/30"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-5">
              <CalendarCheck2 className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-semibold">
                  Module 01
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">4 Daily Sessions</span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-slate-100">
                Employee Attendance Tracker
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Log employee attendance across 4 distinct daily shift sessions. Instant Present/Absent toggles, session summaries, and staff roster management.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200/60 dark:border-slate-800/80">
            <Link
              href="/attendance"
              className="inline-flex items-center justify-between w-full px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold text-sm shadow-lg shadow-amber-600/20 transition-all group"
            >
              <span>Access Attendance System</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Module 2: Billing & P&L Monitor */}
        <div
          onMouseMove={handleCardMouseMove}
          className="glass-panel glass-panel-hover p-6 sm:p-8 rounded-3xl flex flex-col justify-between border-amber-500/20 dark:border-amber-500/30"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-5">
              <Receipt className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-semibold">
                  Module 02
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Itemized P&L</span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-slate-100">
                Billing & Profit Monitor
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Order lifecycle management, expense allocation tracking (materials, labor, overhead, shipping), and manual P&L profit calibration.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200/60 dark:border-slate-800/80">
            <Link
              href="/billing"
              className="inline-flex items-center justify-between w-full px-5 py-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-semibold text-sm shadow-lg shadow-amber-700/20 transition-all group"
            >
              <span>Access Billing & P&L Monitor</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Enterprise Standards Footer Banner */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left border-amber-500/20">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Enterprise Data Persistence — Connected to Production Database System
            </span>
          </div>
          <span className="text-[11px] font-serif font-bold tracking-widest text-amber-800 dark:text-amber-300 uppercase">
            ELYON TRADERS
          </span>
        </div>
      </section>
    </div>
  );
}
