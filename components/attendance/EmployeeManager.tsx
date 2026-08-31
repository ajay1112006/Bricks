"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  X,
  User,
  IndianRupee,
  Wallet,
  Briefcase,
  AlertCircle,
  Users,
  Search,
  Save,
  Trash2,
  CheckCircle2,
  Edit3,
} from "lucide-react";

interface EmployeeManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onEmployeeAdded: () => void;
}

interface EmployeeItem {
  _id?: string;
  employeeId: string;
  name: string;
  role: string;
  department: string;
  dailySalary: number;
  advanceAmount: number;
  status: "Active" | "Inactive";
}

export default function EmployeeManager({ isOpen, onClose, onEmployeeAdded }: EmployeeManagerProps) {
  const [activeTab, setActiveTab] = useState<"add" | "manage">("manage");
  
  // Add Employee Form State
  const [name, setName] = useState("");
  const [role, setRole] = useState("Laborer");
  const [dailySalary, setDailySalary] = useState<string>("");
  const [advanceAmount, setAdvanceAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Manage / Edit Salaries List State
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSalaries, setEditingSalaries] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch full employee list
  const fetchEmployees = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setEmployees(data.data);
        const salaryMap: Record<string, number> = {};
        data.data.forEach((e: EmployeeItem) => {
          salaryMap[e.employeeId] = e.dailySalary || 0;
        });
        setEditingSalaries(salaryMap);
      }
    } catch (err) {
      console.error("Failed to load staff list:", err);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen, fetchEmployees]);

  if (!isOpen) return null;

  // Add new employee handler
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");

    try {
      const payload = {
        name: name.trim(),
        role: role.trim() || "Laborer",
        dailySalary: Number(dailySalary) || 0,
        advanceAmount: Number(advanceAmount) || 0,
      };

      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create employee");
      }

      setName("");
      setRole("Laborer");
      setDailySalary("");
      setAdvanceAmount("");
      setSuccessMsg(`Added ${payload.name} with rate ₹${payload.dailySalary}/day!`);
      setTimeout(() => setSuccessMsg(""), 3500);
      onEmployeeAdded();
      fetchEmployees();
      setActiveTab("manage");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Quick update salary handler for existing employee
  const handleSaveSalary = async (emp: EmployeeItem) => {
    const newSalary = editingSalaries[emp.employeeId] ?? emp.dailySalary;
    setSavingId(emp.employeeId);
    setError("");

    try {
      const res = await fetch(`/api/employees/${emp.employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailySalary: Number(newSalary) || 0,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update salary");
      }

      setSuccessMsg(`Saved ₹${newSalary}/day rate for ${emp.name}!`);
      setTimeout(() => setSuccessMsg(""), 3500);
      onEmployeeAdded();
      fetchEmployees();
    } catch (err: any) {
      setError(err.message || "Could not update salary rate");
    } finally {
      setSavingId(null);
    }
  };

  // Delete employee handler
  const handleDeleteEmployee = async (employeeId: string, empName: string) => {
    if (!confirm(`Are you sure you want to remove ${empName} from the staff registry?`)) return;

    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to delete");

      setSuccessMsg(`Removed ${empName} from roster`);
      setTimeout(() => setSuccessMsg(""), 3000);
      onEmployeeAdded();
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || "Error deleting employee");
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.role && e.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-2xl p-6 relative shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white transition p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Labour & Staff Master Registry
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage labour profiles and edit default daily wage rates (₹/day)
            </p>
          </div>
        </div>

        {/* Notification Toasts */}
        {successMsg && (
          <div className="mb-3 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
          <button
            onClick={() => setActiveTab("manage")}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "manage"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Manage & Edit Salaries</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
              {employees.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("add")}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "add"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add New Staff</span>
          </button>
        </div>

        {/* Tab 1: Manage & Edit Salaries */}
        {activeTab === "manage" && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            {/* Search Filter Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff by name, ID or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Scrollable Employee Salary Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800/80">
              {loadingList ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading staff records...</div>
              ) : filteredEmployees.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No staff members found matching &quot;{searchTerm}&quot;
                </div>
              ) : (
                filteredEmployees.map((emp) => {
                  const currentEditSalary = editingSalaries[emp.employeeId] ?? emp.dailySalary;
                  const isSaving = savingId === emp.employeeId;

                  return (
                    <div
                      key={emp.employeeId}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* Left: Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase truncate">
                            {emp.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">
                            {emp.employeeId}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {emp.role || "Laborer"} • {emp.department || "General"}
                        </span>
                      </div>

                      {/* Right: Salary Edit Box + Actions */}
                      <div className="flex items-center space-x-2 shrink-0">
                        <div className="flex items-center space-x-1 bg-amber-500/5 dark:bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30">
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={currentEditSalary}
                            onChange={(e) =>
                              setEditingSalaries((prev) => ({
                                ...prev,
                                [emp.employeeId]: Number(e.target.value),
                              }))
                            }
                            className="w-20 bg-transparent text-center font-mono font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                            title="Daily Wage Rate (₹/day)"
                          />
                          <span className="text-[10px] text-slate-400">/day</span>
                        </div>

                        <button
                          onClick={() => handleSaveSalary(emp)}
                          disabled={isSaving}
                          className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 disabled:opacity-50"
                          title="Save updated salary rate"
                        >
                          <Save className={`w-3.5 h-3.5 ${isSaving ? "animate-spin" : ""}`} />
                          <span className="hidden sm:inline">Save</span>
                        </button>

                        <button
                          onClick={() => handleDeleteEmployee(emp.employeeId, emp.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                          title="Remove employee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Add New Staff */}
        {activeTab === "add" && (
          <form onSubmit={handleAddSubmit} className="space-y-4 overflow-y-auto pr-1">
            {/* Employee Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Labour / Staff Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Role / Job Position */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Role / Job Position
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Laborer, Mason, Operator, Supervisor"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Grid: Labour Salary & Advance Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Labour Salary / Wage (₹/day)
                </label>
                <div className="relative">
                  <IndianRupee className="w-3.5 h-3.5 text-amber-500 absolute left-3 top-3" />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 1000"
                    value={dailySalary}
                    onChange={(e) => setDailySalary(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Advance Amount Paid (₹)
                </label>
                <div className="relative">
                  <Wallet className="w-3.5 h-3.5 text-amber-500 absolute left-3 top-3" />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 2000"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
              >
                {loading ? "Adding..." : "Add Staff Member"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
