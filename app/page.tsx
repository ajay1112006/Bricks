"use client";

import { useState } from "react";
import SessionTracker from "@/components/attendance/SessionTracker";
import OrderTable from "@/components/billing/OrderTable";
import { CalendarCheck2, Receipt } from "lucide-react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"attendance" | "billing">("attendance");

  return (
    <div className="space-y-6">
      {/* Top Main Feature Selector */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={() => setActiveTab("attendance")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "attendance"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <CalendarCheck2 className="w-4 h-4" />
          <span>Feature 1: Attendance Section</span>
        </button>

        <button
          onClick={() => setActiveTab("billing")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "billing"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Feature 2: Billing & P&L Section</span>
        </button>
      </div>

      {/* Feature Content */}
      {activeTab === "attendance" ? <SessionTracker /> : <OrderTable />}
    </div>
  );
}
