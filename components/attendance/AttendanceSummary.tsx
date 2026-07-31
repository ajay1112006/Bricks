"use client";

import { Users, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { handleCardMouseMove } from "@/lib/useSpotlight";

interface AttendanceSummaryProps {
  totalEmployees: number;
  presentCount: number;
  absentCount: number;
  session: number;
}

export default function AttendanceSummary({
  totalEmployees,
  presentCount,
  absentCount,
  session,
}: AttendanceSummaryProps) {
  const presenceRate = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Total Active Employees */}
      <div
        onMouseMove={handleCardMouseMove}
        className="glass-panel glass-panel-hover p-4 flex items-center justify-between"
      >
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Staff</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalEmployees}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      {/* Present Count */}
      <div
        onMouseMove={handleCardMouseMove}
        className="glass-panel glass-panel-hover p-4 flex items-center justify-between"
      >
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Present (Session {session})</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{presentCount}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      {/* Absent Count */}
      <div
        onMouseMove={handleCardMouseMove}
        className="glass-panel glass-panel-hover p-4 flex items-center justify-between"
      >
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Absent (Session {session})</p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{absentCount}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
        </div>
      </div>

      {/* Attendance Rate % */}
      <div
        onMouseMove={handleCardMouseMove}
        className="glass-panel glass-panel-hover p-4 flex items-center justify-between"
      >
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Presence Rate</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{presenceRate}%</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>
    </div>
  );
}
