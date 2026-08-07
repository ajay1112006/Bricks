"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Wallet,
  TrendingUp,
  Edit2,
  Save,
  X,
  RotateCcw,
  Sparkles,
  Check,
  Building2,
} from "lucide-react";
import { exportDailyAttendanceReportToExcel } from "@/lib/excelExporter";
import { downloadElementAsPDF } from "@/lib/pdfGenerator";

interface SessionStatus {
  s1: boolean;
  s2: boolean;
  s3: boolean;
  s4: boolean;
}

interface EmployeeDayReport {
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  dailySalary: number;
  advanceAmount: number;
  sessionStatus: SessionStatus;
  sessionsAttended: number;
  workCredit: number;
  dayStatus: "Full Day" | "3/4 Day" | "Half Day" | "1/4 Day" | "Absent";
  earnedSalary: number;
  netPayable: number;
}

interface SummaryData {
  totalEmployees: number;
  presentCount: number;
  fullDayCount: number;
  halfDayCount: number;
  absentCount: number;
  totalDailySalary: number;
  totalAdvance: number;
  totalNetPayable: number;
  overallPresenceRate: number;
}

export default function DayWiseAttendanceReport() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toLocaleDateString("sv")
  );
  const [summary, setSummary] = useState<SummaryData>({
    totalEmployees: 0,
    presentCount: 0,
    fullDayCount: 0,
    halfDayCount: 0,
    absentCount: 0,
    totalDailySalary: 0,
    totalAdvance: 0,
    totalNetPayable: 0,
    overallPresenceRate: 0,
  });
  const [reports, setReports] = useState<EmployeeDayReport[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Inline Advance & Salary Editing State
  const [editingEmp, setEditingEmp] = useState<EmployeeDayReport | null>(null);
  const [editAdvance, setEditAdvance] = useState<string>("");
  const [editSalary, setEditSalary] = useState<string>("");
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>("");

  const printReportRef = useRef<HTMLDivElement>(null);

  const fetchDailyReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/attendance/daily-report?date=${selectedDate}`);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to load day report");
      }
      setSummary(data.data.summary);
      setReports(data.data.employeeReports);
      setAvailableDates(data.data.availableDates || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch daily attendance report");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDailyReport();
  }, [fetchDailyReport]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toLocaleDateString("sv"));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toLocaleDateString("sv"));
  };

  const handleToday = () => {
    setSelectedDate(new Date().toLocaleDateString("sv"));
  };

  const handleSaveEmployeeEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;

    setSavingEdit(true);
    try {
      const payload = {
        employeeId: editingEmp.employeeId,
        advanceAmount: Number(editAdvance) || 0,
        dailySalary: Number(editSalary) || 0,
      };

      const res = await fetch("/api/attendance/daily-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update employee daily settings");
      }

      setSaveSuccessMsg(`Updated salary & advance for ${editingEmp.employeeName}`);
      setTimeout(() => setSaveSuccessMsg(""), 3500);
      setEditingEmp(null);
      fetchDailyReport();
    } catch (err: any) {
      alert(err.message || "Could not save employee adjustments");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleExportExcel = () => {
    exportDailyAttendanceReportToExcel(selectedDate, summary, reports);
  };

  const handleExportPDF = async () => {
    if (printReportRef.current) {
      await downloadElementAsPDF(
        printReportRef.current,
        `Elyon_Traders_Daily_Attendance_Salary_Report_${selectedDate}.pdf`
      );
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === "full") return r.sessionsAttended === 4;
    if (filterStatus === "half") return r.sessionsAttended === 2;
    if (filterStatus === "absent") return r.sessionsAttended === 0;
    if (filterStatus === "advance") return r.advanceAmount > 0;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Day Controls */}
      <div className="glass-panel p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100 flex items-center gap-2">
            <span>Day-Wise Attendance, Salary & Advance Statement</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 font-semibold font-sans">
              Daily Ledger
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete daily breakdown of employee attendance shifts, daily wages earned, advance deductions, and net payable salary.
          </p>
        </div>

        {/* Date Navigator & Export Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker Component */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950/90 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1.5 px-2">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-900 dark:text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition"
            >
              Today
            </button>
          </div>

          {/* Export to Excel */}
          <button
            onClick={handleExportExcel}
            disabled={reports.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPDF}
            disabled={reports.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 disabled:opacity-50 transition"
          >
            <FileText className="w-4 h-4" />
            <span>PDF Statement</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 backdrop-blur-md border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{saveSuccessMsg}</span>
          </div>
          <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded font-mono">Updated</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 backdrop-blur-md border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Total Staff */}
        <div className="glass-panel p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Staff</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{summary.totalEmployees}</p>
          <span className="text-[10px] text-slate-400 mt-1">{summary.presentCount} present on this day</span>
        </div>

        {/* Daily Wages Earned */}
        <div className="glass-panel p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Daily Wages Earned</span>
            <IndianRupee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            ₹{summary.totalDailySalary.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 mt-1">Based on shifts worked</span>
        </div>

        {/* Advances Deducted */}
        <div className="glass-panel p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Advances</span>
            <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            ₹{summary.totalAdvance.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 mt-1">Advances paid/taken</span>
        </div>

        {/* Net Daily Payable */}
        <div className="glass-panel p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Net Payable Salary</span>
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            ₹{summary.totalNetPayable.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 mt-1">Wages minus Advance</span>
        </div>

        {/* Presence Rate */}
        <div className="glass-panel p-4 flex flex-col justify-between col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Presence Rate</span>
            <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
            {summary.overallPresenceRate}%
          </p>
          <span className="text-[10px] text-slate-400 mt-1">{summary.fullDayCount} Full day (4/4 shifts)</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search staff name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Staff" },
            { id: "full", label: "Full Day (4/4)" },
            { id: "half", label: "Half Day (2/4)" },
            { id: "absent", label: "Absent (0/4)" },
            { id: "advance", label: "With Advance" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterStatus === f.id
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Printable & Exportable Printable Container */}
      <div ref={printReportRef} className="glass-panel overflow-hidden border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0E0C12] text-slate-900 dark:text-slate-100 p-4 sm:p-6">
        {/* Printable Letterhead Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800 gap-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-600">
              ET
            </div>
            <div>
              <h3 className="text-base font-serif font-bold tracking-wide text-slate-900 dark:text-amber-100">
                ELYON TRADERS — DAILY ATTENDANCE & PAYROLL REPORT
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Date Statement: <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedDate}</span>
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500 dark:text-slate-400">
            <p className="font-semibold">Staff Count: {summary.totalEmployees}</p>
            <p>Net Payable Total: <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{summary.totalNetPayable.toLocaleString()}</span></p>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading daily attendance & salary statement...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
            No employee attendance records found for {selectedDate}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-3 font-semibold">Staff Member</th>
                  <th className="py-3 px-2 font-semibold">Daily Rate</th>
                  <th className="py-3 px-2 text-center font-semibold">S1 (08-10:30)</th>
                  <th className="py-3 px-2 text-center font-semibold">S2 (10:30-13)</th>
                  <th className="py-3 px-2 text-center font-semibold">S3 (14-16:30)</th>
                  <th className="py-3 px-2 text-center font-semibold">S4 (16:30-19)</th>
                  <th className="py-3 px-2 text-center font-semibold">Day Credit</th>
                  <th className="py-3 px-2 text-right font-semibold">Wages Earned</th>
                  <th className="py-3 px-2 text-right font-semibold">Advance</th>
                  <th className="py-3 px-2 text-right font-semibold">Net Payable</th>
                  <th className="py-3 px-2 text-center font-semibold print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {filteredReports.map((r) => {
                  return (
                    <tr
                      key={r.employeeId}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                    >
                      {/* Name & Details */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{r.employeeName}</div>
                        <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{r.employeeId}</span>
                          <span>•</span>
                          <span>{r.role}</span>
                        </div>
                      </td>

                      {/* Daily Salary Rate */}
                      <td className="py-3 px-2 font-mono font-medium text-slate-700 dark:text-slate-300">
                        ₹{r.dailySalary}/day
                      </td>

                      {/* Sessions S1..S4 Badges */}
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-block w-6 h-6 rounded-full text-[10px] font-bold leading-6 ${
                            r.sessionStatus.s1
                              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {r.sessionStatus.s1 ? "P" : "A"}
                        </span>
                      </td>

                      <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-block w-6 h-6 rounded-full text-[10px] font-bold leading-6 ${
                            r.sessionStatus.s2
                              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {r.sessionStatus.s2 ? "P" : "A"}
                        </span>
                      </td>

                      <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-block w-6 h-6 rounded-full text-[10px] font-bold leading-6 ${
                            r.sessionStatus.s3
                              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {r.sessionStatus.s3 ? "P" : "A"}
                        </span>
                      </td>

                      <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-block w-6 h-6 rounded-full text-[10px] font-bold leading-6 ${
                            r.sessionStatus.s4
                              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {r.sessionStatus.s4 ? "P" : "A"}
                        </span>
                      </td>

                      {/* Day Work Credit */}
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.dayStatus === "Full Day"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                              : r.dayStatus === "Half Day"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                              : r.dayStatus === "Absent"
                              ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                              : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                          }`}
                        >
                          {r.sessionsAttended}/4 ({r.workCredit * 100}%)
                        </span>
                      </td>

                      {/* Daily Earned Wages */}
                      <td className="py-3 px-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{r.earnedSalary.toLocaleString()}
                      </td>

                      {/* Advance Amount */}
                      <td className="py-3 px-2 text-right font-mono text-amber-600 dark:text-amber-400">
                        {r.advanceAmount > 0 ? `₹${r.advanceAmount.toLocaleString()}` : "₹0"}
                      </td>

                      {/* Net Payable */}
                      <td className="py-3 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ₹{r.netPayable.toLocaleString()}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-2 text-center print:hidden">
                        <button
                          onClick={() => {
                            setEditingEmp(r);
                            setEditAdvance(String(r.advanceAmount));
                            setEditSalary(String(r.dailySalary));
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Edit Salary & Advance"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Salary & Advance Modal */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-md p-6 relative shadow-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            <button
              onClick={() => setEditingEmp(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white transition p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">{editingEmp.employeeName}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{editingEmp.employeeId} • {editingEmp.role}</p>
              </div>
            </div>

            <form onSubmit={handleSaveEmployeeEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Daily Salary Rate (₹/day)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editSalary}
                  onChange={(e) => setEditSalary(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Employee Advance Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editAdvance}
                  onChange={(e) => setEditAdvance(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                  Advance amount will be deducted from daily earned wages on report statements.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEmp(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition flex items-center space-x-1.5"
                >
                  <Save className={`w-3.5 h-3.5 ${savingEdit ? "animate-spin" : ""}`} />
                  <span>{savingEdit ? "Saving..." : "Save Adjustments"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
