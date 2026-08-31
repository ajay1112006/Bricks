"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Plus,
  Trash2,
  Save,
  Users,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Wallet,
  Sparkles,
  Check,
  X,
  Layers,
  Wrench,
  RotateCcw,
  UserPlus,
  Edit2,
  User,
  Briefcase,
} from "lucide-react";
import { exportWeeklyTeamRegisterToExcel } from "@/lib/excelExporter";
import { downloadElementAsPDF } from "@/lib/pdfGenerator";
import EmployeeManager from "./EmployeeManager";

interface DailyRecord {
  date: string;
  dayName: string;
  status: "P" | "1" | "0.75" | "0.5" | "0.25" | "A" | "" | string;
  advance: number;
}

interface WorkerRow {
  employeeId: string;
  employeeName: string;
  role?: string;
  dailySalary: number;
  dailyRecords: DailyRecord[];
  totalWorkingDays: number;
  totalWeekSalary: number;
  totalAdvance: number;
  balance: number;
}

interface TeamExtraExpense {
  id?: string;
  description: string;
  amount: number;
}

interface TeamGroup {
  teamName: string;
  oldBalance?: number;
  extraExpenses?: TeamExtraExpense[];
  members: WorkerRow[];
  totalTeamDays: number;
  totalTeamSalary: number;
  totalTeamAdvance: number;
  totalTeamBalance: number;
  totalTeamExtraExpenses: number;
  grandTotalPayable: number;
}

interface WeeklyRegisterData {
  weekId: string;
  startDate: string;
  endDate: string;
  monthName: string;
  year: number;
  teams: TeamGroup[];
  notes?: string;
}

// Get Monday of a given date
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

export default function WeeklyTeamRegister() {
  const [currentMonday, setCurrentMonday] = useState<string>(() => {
    const mon = getMonday(new Date());
    return mon.toLocaleDateString("sv");
  });

  const [register, setRegister] = useState<WeeklyRegisterData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>("");
  const [selectedTeamTab, setSelectedTeamTab] = useState<string>("all");

  // Modal / Add states
  const [newTeamName, setNewTeamName] = useState<string>("");
  const [isAddingTeam, setIsAddingTeam] = useState<boolean>(false);
  const [addingWorkerTeamIdx, setAddingWorkerTeamIdx] = useState<number | null>(null);
  const [newWorkerName, setNewWorkerName] = useState<string>("");
  const [newWorkerSalary, setNewWorkerSalary] = useState<number>(800);
  const [newWorkerRole, setNewWorkerRole] = useState<string>("Labor");

  // Extra expense state
  const [addingExpenseTeamIdx, setAddingExpenseTeamIdx] = useState<number | null>(null);
  const [expenseDesc, setExpenseDesc] = useState<string>("");
  const [expenseAmount, setExpenseAmount] = useState<number>(0);

  // Edit Worker Modal / State
  const [editingWorkerInfo, setEditingWorkerInfo] = useState<{
    teamIdx: number;
    memberIdx: number;
    worker: WorkerRow;
  } | null>(null);
  const [editWorkerName, setEditWorkerName] = useState<string>("");
  const [editWorkerRole, setEditWorkerRole] = useState<string>("");
  const [editWorkerSalary, setEditWorkerSalary] = useState<number>(0);
  const [syncToMaster, setSyncToMaster] = useState<boolean>(true);
  const [savingWorkerEdit, setSavingWorkerEdit] = useState<boolean>(false);
  const [isEmployeeManagerOpen, setIsEmployeeManagerOpen] = useState<boolean>(false);

  const printReportRef = useRef<HTMLDivElement>(null);
  const pdfPrintRef = useRef<HTMLDivElement>(null);

  // Fetch or initialize register for selected Monday
  const fetchWeeklyRegister = useCallback(async (mondayStr: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/attendance/weekly-register?startDate=${mondayStr}`);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to load weekly register");
      }
      setRegister(data.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while loading weekly register");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeeklyRegister(currentMonday);
  }, [currentMonday, fetchWeeklyRegister]);

  // Navigate to Previous / Next Week
  const handlePrevWeek = () => {
    const d = new Date(currentMonday);
    d.setDate(d.getDate() - 7);
    const newMon = getMonday(d).toLocaleDateString("sv");
    setCurrentMonday(newMon);
  };

  const handleNextWeek = () => {
    const d = new Date(currentMonday);
    d.setDate(d.getDate() + 7);
    const newMon = getMonday(d).toLocaleDateString("sv");
    setCurrentMonday(newMon);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const selected = new Date(e.target.value);
    const monday = getMonday(selected).toLocaleDateString("sv");
    setCurrentMonday(monday);
  };

  // Recalculate whole register helper
  const recalculateRegister = (reg: WeeklyRegisterData): WeeklyRegisterData => {
    const updatedTeams = reg.teams.map((team) => {
      let teamDays = 0;
      let teamSalary = 0;
      let teamAdvance = 0;
      let teamBalance = 0;

      const updatedMembers = team.members.map((m) => {
        let wDays = 0;
        let wAdvance = 0;

        m.dailyRecords.forEach((dr) => {
          if (dr.status === "P" || dr.status === "1") wDays += 1;
          else if (dr.status === "0.75" || dr.status === ".75" || dr.status === "3/4") wDays += 0.75;
          else if (dr.status === "0.5" || dr.status === ".5" || dr.status === "1/2") wDays += 0.5;
          else if (dr.status === "0.25" || dr.status === ".25" || dr.status === "1/4") wDays += 0.25;
          wAdvance += Number(dr.advance) || 0;
        });

        const wSalary = wDays * (Number(m.dailySalary) || 0);
        const wBal = wSalary - wAdvance;

        teamDays += wDays;
        teamSalary += wSalary;
        teamAdvance += wAdvance;
        teamBalance += wBal;

        return {
          ...m,
          totalWorkingDays: wDays,
          totalWeekSalary: wSalary,
          totalAdvance: wAdvance,
          balance: wBal,
        };
      });

      const totalExtraExpenses = (team.extraExpenses || []).reduce(
        (acc, curr) => acc + (Number(curr.amount) || 0),
        0
      );
      const oldBal = Number(team.oldBalance) || 0;
      const grandTotal = teamBalance + totalExtraExpenses + oldBal;

      return {
        ...team,
        members: updatedMembers,
        totalTeamDays: teamDays,
        totalTeamSalary: teamSalary,
        totalTeamAdvance: teamAdvance,
        totalTeamBalance: teamBalance,
        totalTeamExtraExpenses: totalExtraExpenses,
        grandTotalPayable: grandTotal,
      };
    });

    return {
      ...reg,
      teams: updatedTeams,
    };
  };

  // Toggle P (1.0) -> 0.75 -> 0.5 -> 0.25 -> A -> "" -> P
  const handleToggleDayStatus = (teamIdx: number, memberIdx: number, dayIdx: number) => {
    if (!register) return;
    const newReg = JSON.parse(JSON.stringify(register)) as WeeklyRegisterData;
    const currentStatus = newReg.teams[teamIdx].members[memberIdx].dailyRecords[dayIdx].status;

    let nextStatus: "P" | "0.75" | "0.5" | "0.25" | "A" | "" = "P";
    if (currentStatus === "P" || currentStatus === "1") nextStatus = "0.75";
    else if (currentStatus === "0.75" || currentStatus === ".75") nextStatus = "0.5";
    else if (currentStatus === "0.5" || currentStatus === ".5") nextStatus = "0.25";
    else if (currentStatus === "0.25" || currentStatus === ".25") nextStatus = "A";
    else if (currentStatus === "A") nextStatus = "";
    else nextStatus = "P";

    newReg.teams[teamIdx].members[memberIdx].dailyRecords[dayIdx].status = nextStatus;
    setRegister(recalculateRegister(newReg));
  };

  // Update Daily Advance
  const handleAdvanceChange = (teamIdx: number, memberIdx: number, dayIdx: number, val: string) => {
    if (!register) return;
    const newReg = JSON.parse(JSON.stringify(register)) as WeeklyRegisterData;
    const parsed = val === "" ? 0 : Math.max(0, Number(val));
    newReg.teams[teamIdx].members[memberIdx].dailyRecords[dayIdx].advance = parsed;
    setRegister(recalculateRegister(newReg));
  };

  // Update Worker Daily Salary Rate
  const handleSalaryRateChange = (teamIdx: number, memberIdx: number, val: string) => {
    if (!register) return;
    const newReg = JSON.parse(JSON.stringify(register)) as WeeklyRegisterData;
    const parsed = val === "" ? 0 : Math.max(0, Number(val));
    newReg.teams[teamIdx].members[memberIdx].dailySalary = parsed;
    setRegister(recalculateRegister(newReg));
  };

  // Update Old Balance
  const handleOldBalanceChange = (teamIdx: number, val: string) => {
    if (!register) return;
    const newReg = JSON.parse(JSON.stringify(register)) as WeeklyRegisterData;
    const parsed = val === "" ? 0 : Number(val);
    newReg.teams[teamIdx].oldBalance = parsed;
    setRegister(recalculateRegister(newReg));
  };

  // Bulk actions per team
  const handleBulkSetStatus = (teamIdx: number, targetStatus: "P" | "A") => {
    if (!register) return;
    const newReg = JSON.parse(JSON.stringify(register)) as WeeklyRegisterData;
    newReg.teams[teamIdx].members.forEach((m) => {
      m.dailyRecords.forEach((dr) => {
        dr.status = targetStatus;
      });
    });
    setRegister(recalculateRegister(newReg));
  };

  // Add Worker to Team
  const handleAddWorkerToTeam = (teamIdx: number) => {
    if (!register || !newWorkerName.trim()) return;
    const newReg = JSON.parse(JSON.stringify(register)) as WeeklyRegisterData;
    const days = newReg.teams[0]?.members[0]?.dailyRecords.map((d) => ({
      date: d.date,
      dayName: d.dayName,
      status: "P" as const,
      advance: 0,
    })) || [];

    const newWorker: WorkerRow = {
      employeeId: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      employeeName: newWorkerName.trim().toUpperCase(),
      role: newWorkerRole || "Labor",
      dailySalary: Number(newWorkerSalary) || 800,
      dailyRecords: days,
      totalWorkingDays: 6,
      totalWeekSalary: (Number(newWorkerSalary) || 800) * 6,
      totalAdvance: 0,
      balance: (Number(newWorkerSalary) || 800) * 6,
    };

    newReg.teams[teamIdx].members.push(newWorker);
    setRegister(recalculateRegister(newReg));
    setNewWorkerName("");
    setAddingWorkerTeamIdx(null);
  };

  // Remove Worker from Team
  const handleRemoveWorker = (teamIdx: number, memberIdx: number) => {
    if (!register) return;
    const memberName = register.teams[teamIdx].members[memberIdx].employeeName;
    if (!confirm(`Remove ${memberName} from this weekly wage sheet?`)) return;

    const newReg = JSON.parse(JSON.stringify(register)) as WeeklyRegisterData;
    newReg.teams[teamIdx].members.splice(memberIdx, 1);
    setRegister(recalculateRegister(newReg));
  };

  // Add Extra Expense to Team
  const handleAddExpense = (teamIdx: number) => {
    if (!register || !expenseDesc.trim() || expenseAmount <= 0) return;
    const newReg = JSON.parse(JSON.stringify(register)) as WeeklyRegisterData;
    if (!newReg.teams[teamIdx].extraExpenses) {
      newReg.teams[teamIdx].extraExpenses = [];
    }
    newReg.teams[teamIdx].extraExpenses!.push({
      id: Math.random().toString(36).substring(2, 9),
      description: expenseDesc.trim().toUpperCase(),
      amount: Number(expenseAmount),
    });
    setRegister(recalculateRegister(newReg));
    setExpenseDesc("");
    setExpenseAmount(0);
    setAddingExpenseTeamIdx(null);
  };

  // Remove Extra Expense
  const handleRemoveExpense = (teamIdx: number, expenseId: string) => {
    if (!register) return;
    const newReg = JSON.parse(JSON.stringify(register)) as WeeklyRegisterData;
    newReg.teams[teamIdx].extraExpenses = (newReg.teams[teamIdx].extraExpenses || []).filter(
      (e) => e.id !== expenseId
    );
    setRegister(recalculateRegister(newReg));
  };

  // Open Edit Worker Modal
  const handleOpenEditWorker = (teamIdx: number, memberIdx: number) => {
    if (!register) return;
    const worker = register.teams[teamIdx].members[memberIdx];
    setEditingWorkerInfo({ teamIdx, memberIdx, worker });
    setEditWorkerName(worker.employeeName);
    setEditWorkerRole(worker.role || "Labor");
    setEditWorkerSalary(worker.dailySalary || 0);
    setSyncToMaster(true);
  };

  // Save Worker Edit Changes
  const handleSaveWorkerEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkerInfo || !register) return;

    const { teamIdx, memberIdx } = editingWorkerInfo;
    const newReg = JSON.parse(JSON.stringify(register)) as WeeklyRegisterData;
    const targetMember = newReg.teams[teamIdx].members[memberIdx];

    targetMember.employeeName = editWorkerName.trim().toUpperCase();
    targetMember.role = editWorkerRole.trim() || "Labor";
    targetMember.dailySalary = Math.max(0, Number(editWorkerSalary) || 0);

    const recalculated = recalculateRegister(newReg);
    setRegister(recalculated);
    setSavingWorkerEdit(true);

    if (syncToMaster && targetMember.employeeId) {
      try {
        await fetch("/api/employees", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: targetMember.employeeId,
            name: targetMember.employeeName,
            role: targetMember.role,
            dailySalary: targetMember.dailySalary,
          }),
        });
      } catch (err) {
        console.warn("Could not sync employee to master:", err);
      }
    }

    setSavingWorkerEdit(false);
    setEditingWorkerInfo(null);
    setSaveSuccessMsg(`Updated salary & details for ${targetMember.employeeName}!`);
    setTimeout(() => setSaveSuccessMsg(""), 3500);
  };

  // Add New Team
  const handleAddNewTeam = () => {
    if (!register || !newTeamName.trim()) return;
    const newReg = JSON.parse(JSON.stringify(register)) as WeeklyRegisterData;
    newReg.teams.push({
      teamName: newTeamName.trim().toUpperCase(),
      oldBalance: 0,
      extraExpenses: [],
      members: [],
      totalTeamDays: 0,
      totalTeamSalary: 0,
      totalTeamAdvance: 0,
      totalTeamBalance: 0,
      totalTeamExtraExpenses: 0,
      grandTotalPayable: 0,
    });
    setRegister(recalculateRegister(newReg));
    setNewTeamName("");
    setIsAddingTeam(false);
    setSelectedTeamTab(newTeamName.trim().toUpperCase());
  };

  // Save changes to backend
  const handleSave = async () => {
    if (!register) return;
    setSaving(true);
    setError("");
    setSaveSuccessMsg("");
    try {
      const res = await fetch("/api/attendance/weekly-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(register),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to save register");
      }
      setRegister(data.data);
      setSaveSuccessMsg("Weekly Team Register & Wage Sheet saved to database successfully!");
      setTimeout(() => setSaveSuccessMsg(""), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save weekly register");
    } finally {
      setSaving(false);
    }
  };

  // Calculate Enterprise Totals
  const enterpriseTotals = register?.teams.reduce(
    (acc, t) => {
      acc.workersCount += t.members.length;
      acc.totalDays += t.totalTeamDays;
      acc.totalSalary += t.totalTeamSalary;
      acc.totalAdvance += t.totalTeamAdvance;
      acc.totalBalance += t.totalTeamBalance;
      acc.totalExpenses += t.totalTeamExtraExpenses || 0;
      acc.grandTotal += t.grandTotalPayable;
      return acc;
    },
    {
      workersCount: 0,
      totalDays: 0,
      totalSalary: 0,
      totalAdvance: 0,
      totalBalance: 0,
      totalExpenses: 0,
      grandTotal: 0,
    }
  ) || {
    workersCount: 0,
    totalDays: 0,
    totalSalary: 0,
    totalAdvance: 0,
    totalBalance: 0,
    totalExpenses: 0,
    grandTotal: 0,
  };

  const displayedTeams =
    selectedTeamTab === "all"
      ? register?.teams || []
      : register?.teams.filter((t) => t.teamName === selectedTeamTab) || [];

  return (
    <div className="space-y-6">
      {/* Top Header & Week Controls */}
      <div className="glass-panel p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100 flex items-center gap-2">
              <span>Weekly Team Attendance & Wage Register</span>
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-semibold font-sans">
              Mon – Sat Pay Matrix
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track multi-team worker attendance (P/A/0.5), record daily cash advances, and calculate net weekly wages.
          </p>
        </div>

        {/* Week Navigator & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Week Selector Bar */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2 px-3 py-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200/60 dark:border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                {register ? `${register.startDate} → ${register.endDate}` : currentMonday}
              </span>
              <input
                type="date"
                value={currentMonday}
                onChange={handleDateChange}
                className="opacity-0 absolute w-6 h-6 cursor-pointer"
                title="Jump to date"
              />
            </div>

            <button
              onClick={handleNextWeek}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Export to Excel */}
          <button
            onClick={() => register && exportWeeklyTeamRegisterToExcel(register)}
            disabled={!register || loading}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border border-emerald-600/30 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
            title="Export Weekly Register to Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel Export</span>
          </button>

          {/* Export / Print PDF */}
          <button
            onClick={() => {
              const targetToPrint = pdfPrintRef.current || printReportRef.current;
              if (targetToPrint && register) {
                downloadElementAsPDF(
                  targetToPrint,
                  `Elyon_Traders_Weekly_Team_Register_${register.startDate}.pdf`
                );
              }
            }}
            disabled={!register || loading}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
            title="Download Full Filled PDF Report"
          >
            <Download className="w-4 h-4" />
            <span>PDF Print</span>
          </button>

          {/* Manage Master Staff & Salaries */}
          <button
            onClick={() => setIsEmployeeManagerOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-white transition-all"
            title="Manage Labours & Default Wage Rates"
          >
            <Users className="w-4 h-4" />
            <span>Labour Salaries</span>
          </button>

          {/* Save to DB */}
          <button
            onClick={handleSave}
            disabled={saving || loading || !register}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
            <span>{saving ? "Saving..." : "Save to DB"}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Enterprise KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="glass-panel p-3 border-l-4 border-l-amber-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Active Teams
          </span>
          <div className="text-2xl font-mono font-black text-slate-900 dark:text-slate-100 mt-0.5">
            {register?.teams.length || 0}
          </div>
          <span className="text-[10px] font-semibold text-slate-500">Total contractor units</span>
        </div>

        <div className="glass-panel p-3 border-l-4 border-l-blue-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Workforce
          </span>
          <div className="text-2xl font-mono font-black text-slate-900 dark:text-slate-100 mt-0.5">
            {enterpriseTotals.workersCount}
          </div>
          <span className="text-[10px] font-semibold text-slate-500">Workers enrolled</span>
        </div>

        <div className="glass-panel p-3 border-l-4 border-l-indigo-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Days Worked
          </span>
          <div className="text-2xl font-mono font-black text-indigo-700 dark:text-indigo-300 mt-0.5">
            {enterpriseTotals.totalDays}
          </div>
          <span className="text-[10px] font-semibold text-slate-500">Total shift units</span>
        </div>

        <div className="glass-panel p-3 border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Total Wages
          </span>
          <div className="text-2xl font-mono font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
            ₹{enterpriseTotals.totalSalary.toLocaleString()}
          </div>
          <span className="text-[10px] font-semibold text-slate-500">Gross earned</span>
        </div>

        <div className="glass-panel p-3 border-l-4 border-l-rose-500">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Advances Given
          </span>
          <div className="text-2xl font-mono font-black text-rose-700 dark:text-rose-300 mt-0.5">
            ₹{enterpriseTotals.totalAdvance.toLocaleString()}
          </div>
          <span className="text-[10px] font-semibold text-slate-500">Total cash advance</span>
        </div>

        <div className="glass-panel p-3 border-l-4 border-l-amber-500 bg-amber-500/5 dark:bg-amber-500/10">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
            Grand Payout
          </span>
          <div className="text-2xl font-mono font-black text-amber-800 dark:text-amber-200 mt-0.5">
            ₹{enterpriseTotals.grandTotal.toLocaleString()}
          </div>
          <span className="text-[10px] font-semibold text-slate-500">Net + Extras + Old Bal</span>
        </div>
      </div>

      {/* Team Tabs & Add Team Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedTeamTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              selectedTeamTab === "all"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Teams Overview</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
              {register?.teams.length || 0}
            </span>
          </button>

          {register?.teams.map((team) => (
            <button
              key={team.teamName}
              onClick={() => setSelectedTeamTab(team.teamName)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                selectedTeamTab === team.teamName
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{team.teamName}</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px]">
                {team.members.length}
              </span>
            </button>
          ))}
        </div>

        {/* Add Team Trigger */}
        {!isAddingTeam ? (
          <button
            onClick={() => setIsAddingTeam(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-all border border-amber-500/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Team</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-300 dark:border-slate-700">
            <input
              type="text"
              placeholder="e.g. KUMAR TEAM"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="px-2.5 py-1 text-xs bg-white dark:bg-slate-950 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 uppercase"
              autoFocus
            />
            <button
              onClick={handleAddNewTeam}
              className="px-2.5 py-1 text-xs font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsAddingTeam(false);
                setNewTeamName("");
              }}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Printable Printable Report Section */}
      <div ref={printReportRef} className="space-y-8 bg-transparent">
        {loading ? (
          <div className="glass-panel p-12 text-center">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Loading Weekly Team Attendance & Wage Register...
            </p>
          </div>
        ) : displayedTeams.length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              No Teams Found
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Click &quot;New Team&quot; above to create a team and start logging attendance.
            </p>
          </div>
        ) : (
          displayedTeams.map((team) => {
            const actualTeamIdx = register?.teams.findIndex(
              (t) => t.teamName === team.teamName
            ) ?? -1;

            return (
              <div
                key={team.teamName}
                className="glass-panel overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm"
              >
                {/* Team Header Bar */}
                <div className="p-4 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-slate-900/80 dark:via-slate-900/40 dark:to-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-serif font-bold text-slate-900 dark:text-amber-100 uppercase tracking-wide">
                          {team.teamName}
                        </h3>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-medium">
                          {team.members.length} Workers
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {register?.monthName} {register?.year} • {register?.startDate} to {register?.endDate}
                      </span>
                    </div>
                  </div>

                  {/* Team Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleBulkSetStatus(actualTeamIdx, "P")}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 transition-all"
                      title="Mark all workers Present for the whole week"
                    >
                      All Present
                    </button>
                    <button
                      onClick={() => handleBulkSetStatus(actualTeamIdx, "A")}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all"
                      title="Mark all workers Absent"
                    >
                      All Absent
                    </button>
                  </div>
                </div>

                {/* Team Multi-Day Register Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        <th className="p-2.5 w-10 text-center font-bold">#</th>
                        <th className="p-2.5 min-w-[140px] font-bold">WORKER</th>
                        <th className="p-2.5 min-w-[90px] text-center font-bold">RATE (₹/day)</th>

                        {/* Mon to Sat Days */}
                        {team.members[0]?.dailyRecords.map((dr, dayIdx) => (
                          <th
                            key={dr.date}
                            className="p-2 min-w-[100px] text-center border-l border-slate-200 dark:border-slate-800"
                          >
                            <div className="font-bold text-[11px] text-slate-900 dark:text-slate-100">
                              {dr.dayName.substring(0, 3)}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              {dr.date.split("-").slice(1).join("/")}
                            </div>
                          </th>
                        ))}

                        <th className="p-2.5 w-16 text-center font-bold bg-indigo-50/50 dark:bg-indigo-950/20 border-l border-slate-200 dark:border-slate-800">
                          DAYS
                        </th>
                        <th className="p-2.5 w-24 text-right font-bold bg-emerald-50/50 dark:bg-emerald-950/20 border-l border-slate-200 dark:border-slate-800">
                          TOTAL WAGES
                        </th>
                        <th className="p-2.5 w-24 text-right font-bold bg-rose-50/50 dark:bg-rose-950/20 border-l border-slate-200 dark:border-slate-800">
                          ADVANCE
                        </th>
                        <th className="p-2.5 w-28 text-right font-bold bg-amber-50/50 dark:bg-amber-950/20 border-l border-slate-200 dark:border-slate-800 text-amber-700 dark:text-amber-300">
                          BALANCE
                        </th>
                        <th className="p-2.5 min-w-[70px] text-center font-bold">ACTIONS</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {team.members.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="p-6 text-center text-slate-400">
                            No workers in this team yet. Click &quot;Add Worker&quot; to enroll staff.
                          </td>
                        </tr>
                      ) : (
                        team.members.map((m, mIdx) => (
                          <tr
                            key={m.employeeId || mIdx}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors"
                          >
                            <td className="p-2 text-center text-slate-400 font-mono text-[11px]">
                              {String(mIdx + 1).padStart(2, "0")}
                            </td>

                            {/* Worker Name & Role */}
                            <td className="p-2">
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                {m.employeeName}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                                <span className="font-mono">{m.employeeId}</span>
                                <span>•</span>
                                <span>{m.role || "Labor"}</span>
                              </div>
                            </td>

                            {/* Daily Rate Input */}
                            <td className="p-2 text-center">
                              <div className="inline-flex items-center justify-center">
                                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mr-0.5 select-none">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={m.dailySalary !== undefined && m.dailySalary !== null ? m.dailySalary : ""}
                                  onChange={(e) =>
                                    handleSalaryRateChange(actualTeamIdx, mIdx, e.target.value)
                                  }
                                  title="Click to edit Labour Wage Rate (₹/day)"
                                  className="w-16 py-1 text-center font-mono font-bold text-xs bg-amber-500/10 hover:bg-amber-500/20 focus:bg-white dark:focus:bg-slate-900 rounded border border-amber-500/40 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-900 dark:text-slate-100 outline-none transition-all"
                                />
                              </div>
                            </td>

                            {/* 6 Day Columns (Mon - Sat) */}
                            {m.dailyRecords.map((dr, dayIdx) => {
                              const isPresent = dr.status === "P" || dr.status === "1";
                              const isThreeQuarter = dr.status === "0.75" || dr.status === ".75";
                              const isHalf = dr.status === "0.5" || dr.status === ".5";
                              const isQuarter = dr.status === "0.25" || dr.status === ".25";
                              const isAbsent = dr.status === "A";

                              return (
                                <td
                                  key={dr.date}
                                  className="p-1.5 text-center border-l border-slate-100 dark:border-slate-800/80 align-top"
                                >
                                  {/* Fractional Day Toggle Badge */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleDayStatus(actualTeamIdx, mIdx, dayIdx)
                                    }
                                    className={`w-full py-1 rounded text-[11px] font-bold transition-all shadow-xs flex items-center justify-center space-x-1 ${
                                      isPresent
                                        ? "bg-emerald-600 text-white shadow-emerald-600/20"
                                        : isThreeQuarter
                                        ? "bg-teal-600 text-white shadow-teal-600/20"
                                        : isHalf
                                        ? "bg-amber-500 text-white shadow-amber-500/20"
                                        : isQuarter
                                        ? "bg-purple-600 text-white shadow-purple-600/20"
                                        : isAbsent
                                        ? "bg-rose-600 text-white shadow-rose-600/20"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200"
                                    }`}
                                    title={`Click to cycle: Present (P) -> 0.75 -> 0.5 -> 0.25 -> Absent (A) -> None`}
                                  >
                                    <span>{dr.status || "-"}</span>
                                  </button>

                                  {/* Daily Advance Input Box */}
                                  <div className="mt-1 flex items-center">
                                    <span className="text-[9px] text-slate-400 mr-0.5">₹</span>
                                    <input
                                      type="number"
                                      placeholder="0"
                                      value={dr.advance > 0 ? dr.advance : ""}
                                      onChange={(e) =>
                                        handleAdvanceChange(
                                          actualTeamIdx,
                                          mIdx,
                                          dayIdx,
                                          e.target.value
                                        )
                                      }
                                      className={`w-full px-1 py-0.5 text-center font-mono text-[10px] rounded border focus:outline-none transition-all ${
                                        dr.advance > 0
                                          ? "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-bold"
                                          : "bg-slate-50/50 dark:bg-slate-950/50 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                                      }`}
                                      title="Daily Cash Advance given on this day"
                                    />
                                  </div>
                                </td>
                              );
                            })}

                            {/* Total Working Days */}
                            <td className="p-2 text-center font-mono font-black text-sm bg-indigo-50/50 dark:bg-indigo-950/20 border-l border-slate-200 dark:border-slate-800 text-indigo-950 dark:text-indigo-200">
                              {m.totalWorkingDays}
                            </td>

                            {/* Total Week Salary */}
                            <td className="p-2 text-right font-mono font-black text-sm bg-emerald-50/50 dark:bg-emerald-950/20 border-l border-slate-200 dark:border-slate-800 text-emerald-900 dark:text-emerald-300">
                              ₹{m.totalWeekSalary.toLocaleString()}
                            </td>

                            {/* Total Advance */}
                            <td className="p-2 text-right font-mono font-black text-sm bg-rose-50/50 dark:bg-rose-950/20 border-l border-slate-200 dark:border-slate-800 text-rose-800 dark:text-rose-300">
                              ₹{m.totalAdvance.toLocaleString()}
                            </td>

                            {/* Balance */}
                            <td className="p-2 text-right font-mono font-black text-sm bg-amber-50/50 dark:bg-amber-950/20 border-l border-slate-200 dark:border-slate-800 text-amber-950 dark:text-amber-200">
                              ₹{m.balance.toLocaleString()}
                            </td>

                            {/* Actions Column: Edit & Delete */}
                            <td className="p-1.5 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  onClick={() => handleOpenEditWorker(actualTeamIdx, mIdx)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-500/10 transition-all"
                                  title={`Edit ${m.employeeName}'s Salary & Details`}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRemoveWorker(actualTeamIdx, mIdx)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                  title="Remove Worker from sheet"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>

                    {/* Team Sub-Totals Row */}
                    <tfoot>
                      <tr className="bg-slate-200/80 dark:bg-slate-900 border-t-2 border-slate-400 dark:border-slate-600 font-black text-slate-900 dark:text-slate-100">
                        <td colSpan={2} className="p-2.5 text-left uppercase text-xs tracking-wider">
                          {team.teamName} SUB-TOTALS
                        </td>
                        <td className="p-2.5 text-center text-slate-400">-</td>

                        {/* Day-wise total advances */}
                        {team.members[0]?.dailyRecords.map((dr, dayIdx) => {
                          const dayTotalAdvance = team.members.reduce((sum, mem) => {
                            const rec = mem.dailyRecords.find((r) => r.date === dr.date);
                            return sum + (rec?.advance || 0);
                          }, 0);

                          return (
                            <td
                              key={dr.date}
                              className="p-2 text-center border-l border-slate-300 dark:border-slate-700"
                            >
                              <div className="text-[11px] font-mono font-black text-slate-800 dark:text-slate-200">
                                {dayTotalAdvance > 0 ? `₹${dayTotalAdvance}` : "—"}
                              </div>
                            </td>
                          );
                        })}

                        <td className="p-2.5 text-center font-mono font-black text-sm bg-indigo-200/60 dark:bg-indigo-950/50 border-l border-slate-300 dark:border-slate-700 text-indigo-950 dark:text-indigo-100">
                          {team.totalTeamDays}
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-sm bg-emerald-200/60 dark:bg-emerald-950/50 border-l border-slate-300 dark:border-slate-700 text-emerald-950 dark:text-emerald-100">
                          ₹{team.totalTeamSalary.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-sm bg-rose-200/60 dark:bg-rose-950/50 border-l border-slate-300 dark:border-slate-700 text-rose-950 dark:text-rose-100">
                          ₹{team.totalTeamAdvance.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-sm bg-amber-200/60 dark:bg-amber-950/50 border-l border-slate-300 dark:border-slate-700 text-amber-950 dark:text-amber-100">
                          ₹{team.totalTeamBalance.toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Team Extra Expenses & Old Balance Footer Box */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Extra Expenses / Machine Work Table */}
                  <div className="lg:col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                        <Wrench className="w-3.5 h-3.5 text-amber-600" />
                        <span>Extra Tasks / Machine Cleaning Expenses</span>
                      </span>

                      {addingExpenseTeamIdx !== actualTeamIdx && (
                        <button
                          onClick={() => setAddingExpenseTeamIdx(actualTeamIdx)}
                          className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Task Expense</span>
                        </button>
                      )}
                    </div>

                    {/* Inline Add Expense */}
                    {addingExpenseTeamIdx === actualTeamIdx && (
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs">
                        <input
                          type="text"
                          placeholder="e.g. MACHINE CLEANING 150*4"
                          value={expenseDesc}
                          onChange={(e) => setExpenseDesc(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-950 rounded border border-slate-300 dark:border-slate-700"
                        />
                        <div className="flex items-center space-x-1">
                          <span>₹</span>
                          <input
                            type="number"
                            placeholder="600"
                            value={expenseAmount || ""}
                            onChange={(e) => setExpenseAmount(Number(e.target.value))}
                            className="w-20 px-2 py-1 text-xs bg-slate-50 dark:bg-slate-950 rounded border border-slate-300 dark:border-slate-700 font-mono"
                          />
                        </div>
                        <button
                          onClick={() => handleAddExpense(actualTeamIdx)}
                          className="px-2.5 py-1 bg-amber-500 text-white rounded font-bold hover:bg-amber-600"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setAddingExpenseTeamIdx(null)}
                          className="p-1 text-slate-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Itemized expenses pills */}
                    <div className="flex flex-wrap gap-2">
                      {(!team.extraExpenses || team.extraExpenses.length === 0) ? (
                        <span className="text-[11px] text-slate-400 italic">
                          No extra machine/cleaning expenses recorded for this team.
                        </span>
                      ) : (
                        team.extraExpenses.map((ex) => (
                          <div
                            key={ex.id}
                            className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-xs"
                          >
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {ex.description}:
                            </span>
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                              ₹{ex.amount.toLocaleString()}
                            </span>
                            <button
                              onClick={() => handleRemoveExpense(actualTeamIdx, ex.id!)}
                              className="text-slate-300 hover:text-rose-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                       {/* Payout Calculation Box */}
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                      <span className="font-bold">Team Net Wages Balance:</span>
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-slate-100">
                        ₹{team.totalTeamBalance.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                      <span className="font-bold">Extra Tasks / Machine Cleaning:</span>
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-slate-100">
                        + ₹{(team.totalTeamExtraExpenses || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                      <span className="font-bold">Old Balance Carryover:</span>
                      <div className="flex items-center space-x-1">
                        <span className="font-bold">₹</span>
                        <input
                          type="number"
                          value={team.oldBalance || ""}
                          onChange={(e) => handleOldBalanceChange(actualTeamIdx, e.target.value)}
                          placeholder="0"
                          className="w-20 px-1.5 py-0.5 text-right font-mono font-black text-xs bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div className="border-t-2 border-slate-300 dark:border-slate-700 pt-2 flex justify-between items-center">
                      <span className="font-black text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300">
                        Grand Total Payable:
                      </span>
                      <span className="font-mono font-black text-base text-amber-700 dark:text-amber-300">
                        ₹{team.grandTotalPayable.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Worker & Salary Rate Modal */}
      {editingWorkerInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md p-6 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl relative text-slate-900 dark:text-slate-100">
            <button
              onClick={() => setEditingWorkerInfo(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white transition p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Edit Labour Salary & Details
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Modify daily wage rate and worker info for this sheet
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveWorkerEdit} className="space-y-4">
              {/* Worker Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Worker / Labour Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={editWorkerName}
                    onChange={(e) => setEditWorkerName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold uppercase text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Role / Position
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={editWorkerRole}
                    onChange={(e) => setEditWorkerRole(e.target.value)}
                    placeholder="e.g. Labor, Mason, Operator, Lead"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Daily Salary / Wage Rate */}
              <div className="p-3.5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <label className="block text-xs font-bold text-amber-800 dark:text-amber-200 mb-1">
                  Labour Daily Salary / Wage Rate (₹/day)
                </label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-amber-600 dark:text-amber-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={editWorkerSalary || ""}
                    onChange={(e) => setEditWorkerSalary(Number(e.target.value))}
                    placeholder="e.g. 1000"
                    className="w-full bg-white dark:bg-slate-950 border border-amber-500/40 rounded-xl pl-9 pr-3 py-2 text-sm font-mono font-bold text-amber-700 dark:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Calculates total week salary & net balance automatically.
                </p>
              </div>

              {/* Master Sync Checkbox */}
              <label className="flex items-start space-x-2.5 cursor-pointer p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                <input
                  type="checkbox"
                  checked={syncToMaster}
                  onChange={(e) => setSyncToMaster(e.target.checked)}
                  className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Update Master Labour Profile
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Save this daily salary to master database so upcoming weekly registers automatically use this new rate.
                  </p>
                </div>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingWorkerInfo(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingWorkerEdit || !editWorkerName.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingWorkerEdit ? "Updating..." : "Save Salary & Worker"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Dedicated Filled PDF Report Template (Captured by html2canvas for 100% Filled Columns) */}
      <div style={{ position: "absolute", left: "-9999px", top: 0, width: "1200px" }}>
        <div ref={pdfPrintRef} className="p-8 bg-white text-slate-900 font-sans space-y-6">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">
                ELYON TRADERS
              </h1>
              <p className="text-[10px] font-serif font-bold tracking-[0.25em] text-amber-800 uppercase">
                THE MOST HIGH
              </p>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                5/1A, Kanagamoolamkudieruppu, Thazhakudy Post, K.K.Dist - 629 901. | GSTIN: 33AGVPG0116E2ZT
              </p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded uppercase tracking-wider">
                Weekly Attendance & Wage Register
              </span>
              <p className="text-xs font-mono font-bold text-slate-700 mt-1">
                {register?.monthName} {register?.year} • {register?.startDate} to {register?.endDate}
              </p>
            </div>
          </div>

          {/* Teams Table */}
          {register?.teams.map((team, tIdx) => (
            <div key={tIdx} className="space-y-3 border border-slate-400 rounded-lg p-4 bg-slate-50/50">
              <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                <span className="text-base font-bold uppercase tracking-wide text-slate-900">
                  {team.teamName} ({team.members.length} Workers)
                </span>
                <span className="text-xs font-bold font-mono text-slate-700">
                  Team Net Payable: ₹{team.grandTotalPayable.toLocaleString()}
                </span>
              </div>

              <table className="w-full text-left text-xs border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-400">
                    <th className="p-2 border border-slate-300 w-8 text-center">#</th>
                    <th className="p-2 border border-slate-300 min-w-[140px]">WORKER NAME</th>
                    <th className="p-2 border border-slate-300 text-center w-24">RATE (₹/day)</th>
                    {team.members[0]?.dailyRecords.map((dr, dIdx) => (
                      <th key={dIdx} className="p-2 border border-slate-300 text-center min-w-[65px]">
                        <div>{dr.dayName.substring(0, 3)}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{dr.date.split("-").slice(1).join("/")}</div>
                      </th>
                    ))}
                    <th className="p-2 border border-slate-300 text-center w-12 bg-indigo-50">DAYS</th>
                    <th className="p-2 border border-slate-300 text-right w-24 bg-emerald-50">TOTAL WAGES</th>
                    <th className="p-2 border border-slate-300 text-right w-20 bg-rose-50">ADVANCE</th>
                    <th className="p-2 border border-slate-300 text-right w-24 bg-amber-50">BALANCE</th>
                  </tr>
                </thead>
                <tbody>
                  {team.members.map((m, mIdx) => (
                    <tr key={mIdx} className="border-b border-slate-300">
                      <td className="p-2 border border-slate-300 text-center font-mono text-slate-600">
                        {String(mIdx + 1).padStart(2, "0")}
                      </td>
                      <td className="p-2 border border-slate-300">
                        <div className="font-bold text-slate-900">{m.employeeName}</div>
                        <div className="text-[10px] text-slate-500">{m.employeeId} • {m.role || "Labor"}</div>
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold text-slate-900">
                        ₹{m.dailySalary || 0}
                      </td>
                      {m.dailyRecords.map((dr, dIdx) => (
                        <td key={dIdx} className="p-1.5 border border-slate-300 text-center align-top">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              dr.status === "P" || dr.status === "1"
                                ? "bg-emerald-600 text-white"
                                : dr.status === "0.75" || dr.status === ".75"
                                ? "bg-teal-600 text-white"
                                : dr.status === "0.5" || dr.status === ".5"
                                ? "bg-amber-500 text-white"
                                : dr.status === "0.25" || dr.status === ".25"
                                ? "bg-purple-600 text-white"
                                : dr.status === "A"
                                ? "bg-rose-600 text-white"
                                : "text-slate-400"
                            }`}
                          >
                            {dr.status || "-"}
                          </span>
                          {dr.advance > 0 && (
                            <div className="text-[9px] font-mono font-bold text-rose-700 mt-0.5">
                              ₹{dr.advance}
                            </div>
                          )}
                        </td>
                      ))}
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold bg-indigo-50/50 text-indigo-900">
                        {m.totalWorkingDays}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-mono font-bold bg-emerald-50/50 text-emerald-900">
                        ₹{m.totalWeekSalary.toLocaleString()}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-mono font-bold bg-rose-50/50 text-rose-900">
                        ₹{m.totalAdvance.toLocaleString()}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-mono font-bold bg-amber-50/50 text-amber-900">
                        ₹{m.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-200 font-bold text-slate-900 border-t-2 border-slate-400">
                    <td colSpan={2} className="p-2 border border-slate-300 uppercase">
                      {team.teamName} SUB-TOTALS
                    </td>
                    <td className="p-2 border border-slate-300 text-center">-</td>
                    {team.members[0]?.dailyRecords.map((dr, dIdx) => {
                      const dayAdv = team.members.reduce((sum, mem) => {
                        const rec = mem.dailyRecords.find((r) => r.date === dr.date);
                        return sum + (rec?.advance || 0);
                      }, 0);
                      return (
                        <td key={dIdx} className="p-2 border border-slate-300 text-center font-mono text-[10px]">
                          {dayAdv > 0 ? `₹${dayAdv}` : "—"}
                        </td>
                      );
                    })}
                    <td className="p-2 border border-slate-300 text-center font-mono">{team.totalTeamDays}</td>
                    <td className="p-2 border border-slate-300 text-right font-mono">₹{team.totalTeamSalary.toLocaleString()}</td>
                    <td className="p-2 border border-slate-300 text-right font-mono">₹{team.totalTeamAdvance.toLocaleString()}</td>
                    <td className="p-2 border border-slate-300 text-right font-mono text-amber-900">₹{team.totalTeamBalance.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Extra Expenses & Payout Summary */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-white border border-slate-300 rounded-lg text-xs">
                <div>
                  <span className="font-bold text-slate-800 block mb-1">Extra Tasks / Machine Cleaning:</span>
                  {(!team.extraExpenses || team.extraExpenses.length === 0) ? (
                    <span className="text-slate-500 italic text-[11px]">None recorded</span>
                  ) : (
                    team.extraExpenses.map((ex, i) => (
                      <div key={i} className="flex justify-between text-slate-700">
                        <span>• {ex.description}:</span>
                        <span className="font-mono font-bold">₹{ex.amount.toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="space-y-1 font-mono text-right">
                  <div>Team Net Wages: <span className="font-bold">₹{team.totalTeamBalance.toLocaleString()}</span></div>
                  <div>Extra Tasks: <span className="font-bold">+ ₹{(team.totalTeamExtraExpenses || 0).toLocaleString()}</span></div>
                  <div>Old Balance: <span className="font-bold">₹{(team.oldBalance || 0).toLocaleString()}</span></div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-sm text-slate-900">
                    Grand Total Payable: ₹{team.grandTotalPayable.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
