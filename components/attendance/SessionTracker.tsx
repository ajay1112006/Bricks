"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  Check,
  X,
  UserPlus,
  Save,
  CheckCircle,
  AlertCircle,
  Search,
  Zap,
  RotateCcw
} from "lucide-react";
import AttendanceSummary from "./AttendanceSummary";
import EmployeeManager from "./EmployeeManager";

interface AttendanceRecord {
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  status: "Present" | "Absent";
  notes?: string;
}

const SESSIONS = [
  { id: 1, name: "Session 1", time: "08:00 - 10:30", desc: "Morning Shift 1" },
  { id: 2, name: "Session 2", time: "10:30 - 13:00", desc: "Morning Shift 2" },
  { id: 3, name: "Session 3", time: "14:00 - 16:30", desc: "Afternoon Shift 1" },
  { id: 4, name: "Session 4", time: "16:30 - 19:00", desc: "Afternoon Shift 2" },
];

export default function SessionTracker() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toLocaleDateString("sv")
  );
  const [activeSession, setActiveSession] = useState<number>(1);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState<boolean>(false);
  const [saveNotification, setSaveNotification] = useState<string>("");

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/attendance?date=${selectedDate}&session=${activeSession}`);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to load attendance");
      }
      setRecords(data.data.records || []);
      setIsSaved(data.data.isSaved);
    } catch (err: any) {
      setError(err.message || "Failed to fetch session data");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, activeSession]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleToggleStatus = (employeeId: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.employeeId === employeeId) {
          return {
            ...r,
            status: r.status === "Present" ? "Absent" : "Present",
          };
        }
        return r;
      })
    );
  };

  const handleMarkAll = (targetStatus: "Present" | "Absent") => {
    setRecords((prev) =>
      prev.map((r) => ({
        ...r,
        status: targetStatus,
      }))
    );
  };

  const handleSaveSession = async () => {
    setSaving(true);
    setError("");
    setSaveNotification("");
    try {
      const payload = {
        date: selectedDate,
        session: activeSession,
        records: records.map((r) => ({
          employeeId: r.employeeId,
          employeeName: r.employeeName,
          status: r.status,
          notes: r.notes || "",
        })),
      };

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to save attendance");
      }

      setIsSaved(true);
      setSaveNotification(`Session ${activeSession} saved successfully!`);
      setTimeout(() => setSaveNotification(""), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to persist attendance");
    } finally {
      setSaving(false);
    }
  };

  const filteredRecords = records.filter(
    (r) =>
      r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presentCount = records.filter((r) => r.status === "Present").length;
  const absentCount = records.filter((r) => r.status === "Absent").length;

  return (
    <div className="space-y-6">
      {/* Top Header & Controls */}
      <div className="glass-panel p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Daily Session Mark-In</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-semibold">
              4 Sessions / Day
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Rapid attendance logging organized into 4 distinct daily operational sessions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center space-x-2 bg-slate-100/70 dark:bg-slate-950/70 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm text-slate-900 dark:text-slate-200 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Add Employee Button */}
          <button
            onClick={() => setIsEmployeeModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-medium border border-slate-200 dark:border-slate-700/80 transition"
          >
            <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Add Staff</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSaveSession}
            disabled={saving || loading || records.length === 0}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-emerald-600/20 transition"
          >
            <Save className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
            <span>{saving ? "Saving..." : "Save Session"}</span>
          </button>
        </div>
      </div>

      {/* Save Notification Alert */}
      {saveNotification && (
        <div className="p-4 rounded-xl bg-emerald-500/10 backdrop-blur-md border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{saveNotification}</span>
          </div>
          <span className="text-xs bg-emerald-500/20 px-2 py-0.5 rounded font-mono">Persisted</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 backdrop-blur-md border border-rose-500/30 text-rose-700 dark:text-rose-300 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Sessions Tabs Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SESSIONS.map((s) => {
          const isActive = activeSession === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSession(s.id)}
              className={`glass-card p-4 text-left transition-all duration-300 ${
                isActive
                  ? "bg-white/60 dark:bg-white/15 border-white/80 dark:border-white/40 shadow-lg ring-1 ring-white/30 -translate-y-0.5"
                  : "glass-card-hover"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "bg-slate-200/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-400"
                  }`}
                >
                  {s.name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {s.time}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 mt-2">{s.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Attendance Summary Widgets */}
      <AttendanceSummary
        totalEmployees={records.length}
        presentCount={presentCount}
        absentCount={absentCount}
        session={activeSession}
      />

      {/* Quick Mark & Search Tools */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search employee name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Rapid Actions */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden md:inline flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Bulk Mark:
          </span>
          <button
            onClick={() => handleMarkAll("Present")}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" /> All Present
          </button>
          <button
            onClick={() => handleMarkAll("Absent")}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold border border-rose-500/20 transition flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> All Absent
          </button>
          <button
            onClick={fetchAttendance}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            title="Reload Session"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Employees Roster List */}
      <div className="glass-panel overflow-hidden border-slate-200 dark:border-slate-800/80">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/60">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200">
              Employee Roster — Session {activeSession} ({selectedDate})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click toggles to switch Present / Absent status
            </p>
          </div>
          <div className="text-xs font-medium">
            {isSaved ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" /> Saved to DB
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">Unsaved Changes</span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading employee roster...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
            No employees found matching your search.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800/60">
            {filteredRecords.map((r, index) => {
              const isPresent = r.status === "Present";
              return (
                <div
                  key={r.employeeId}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    isPresent
                      ? "hover:bg-slate-50 dark:hover:bg-slate-900/40"
                      : "bg-rose-50/50 dark:bg-rose-950/10 hover:bg-rose-100/50 dark:hover:bg-rose-950/20"
                  }`}
                >
                  {/* Left: Employee Info */}
                  <div className="flex items-center space-x-3.5">
                    <div className="w-8 text-xs font-mono text-slate-400 dark:text-slate-500 font-bold">
                      #{String(index + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{r.employeeName}</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {r.employeeId}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>{r.role}</span>
                        <span>•</span>
                        <span className="text-blue-600 dark:text-blue-400 font-medium">{r.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status Toggle Switch & Badges */}
                  <div className="flex items-center space-x-4">
                    <div className="text-right hidden sm:block">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          isPresent
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    {/* Interactive Present/Absent Toggle Mechanism */}
                    <div className="flex items-center rounded-xl p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => {
                          if (!isPresent) handleToggleStatus(r.employeeId);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                          isPresent
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Present</span>
                      </button>

                      <button
                        onClick={() => {
                          if (isPresent) handleToggleStatus(r.employeeId);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                          !isPresent
                            ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Absent</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Employee Manager Modal */}
      <EmployeeManager
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onEmployeeAdded={fetchAttendance}
      />
    </div>
  );
}
