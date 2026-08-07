"use client";

import { useState, useEffect, useRef } from "react";
import {
  Clock,
  UserCheck,
  DollarSign,
  Plus,
  Trash2,
  Download,
  Save,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Users,
  Building2,
  X,
  UserPlus,
  Check,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  User
} from "lucide-react";
import { handleCardMouseMove } from "@/lib/useSpotlight";
import { downloadElementAsPDF } from "@/lib/pdfGenerator";

interface LaborWageItem {
  id: string;
  name: string;
  rate: number;
  hours: number;
  advance: number;
  total: number;
}

interface SystemEmployee {
  _id?: string;
  employeeId: string;
  name: string;
  role?: string;
  department?: string;
}

interface HoursRentRecord {
  rentId: string;
  date: string;
  partyName: string;
  pricePerHour: number;
  hours: number;
  totalAmount: number;
  padiPaid: number;
  netBalance: number;
  laborWages: LaborWageItem[];
  totalLaborCost: number;
  dieselCost?: number;
  dieselLiters?: number;
  netProfitMargin: number;
  createdAt: string;
}

export default function SplitterPage() {
  const todayStr = new Date().toLocaleDateString("sv");

  // Main Form Inputs (default values match the handwritten image)
  const [date, setDate] = useState("2026-08-01");
  const [partyName, setPartyName] = useState("Selvaraj");
  const [pricePerHour, setPricePerHour] = useState<number>(1300);
  const [hours, setHours] = useState<number>(8);
  const [padiPaid, setPadiPaid] = useState<number>(3000);
  const [dieselCost, setDieselCost] = useState<number>(0);
  const [dieselLiters, setDieselLiters] = useState<number>(0);

  // Right Column: Operator & Labor List
  const [laborWages, setLaborWages] = useState<LaborWageItem[]>([
    { id: "lab-op-1", name: "Operator", rate: 140, hours: 8, advance: 0, total: 1120 },
    { id: "lab-1", name: "Lab-1", rate: 130, hours: 8, advance: 0, total: 1040 },
    { id: "lab-2", name: "Lab-2", rate: 130, hours: 8, advance: 0, total: 1040 },
    { id: "lab-3", name: "Lab-3", rate: 130, hours: 8, advance: 0, total: 1040 },
    { id: "lab-4", name: "Lab-4", rate: 130, hours: 8, advance: 0, total: 1040 },
  ]);

  // System employees roster
  const [systemEmployees, setSystemEmployees] = useState<SystemEmployee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Saved Records
  const [savedRecords, setSavedRecords] = useState<HoursRentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  // Printable Slip Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activeSlipRecord, setActiveSlipRecord] = useState<HoursRentRecord | null>(null);
  const slipPrintRef = useRef<HTMLDivElement>(null);

  // Add Party / Client Modal State
  const [isAddPartyModalOpen, setIsAddPartyModalOpen] = useState(false);
  const [newPartyNameInput, setNewPartyNameInput] = useState("");
  const [newPartyPhoneInput, setNewPartyPhoneInput] = useState("");
  const [newPartyEmailInput, setNewPartyEmailInput] = useState("");
  const [newPartyAddressInput, setNewPartyAddressInput] = useState("");

  // Add Laborer Modal State
  const [isAddLaborModalOpen, setIsAddLaborModalOpen] = useState(false);
  const [newLaborName, setNewLaborName] = useState("");
  const [newLaborRate, setNewLaborRate] = useState<number>(130);
  const [newLaborHours, setNewLaborHours] = useState<number>(hours);
  const [newLaborAdvance, setNewLaborAdvance] = useState<number>(0);
  const [selectedSystemEmp, setSelectedSystemEmp] = useState<string>("");
  
  // New Employee Creation inside Modal
  const [showCreateEmpSection, setShowCreateEmpSection] = useState(false);
  const [empCreateName, setEmpCreateName] = useState("");
  const [empCreateRole, setEmpCreateRole] = useState("Mason");
  const [creatingEmp, setCreatingEmp] = useState(false);

  // Toast / Feedback message
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Scroll ref for labor list
  const laborListRef = useRef<HTMLDivElement>(null);

  // Calculated values
  const totalAmount = Number((pricePerHour * hours).toFixed(2));
  const netBalance = Math.max(0, Number((totalAmount - padiPaid).toFixed(2)));

  // Recalculate labor totals & net profit
  const totalLaborCost = laborWages.reduce((acc, curr) => acc + curr.rate * curr.hours, 0);
  const totalLaborAdvance = laborWages.reduce((acc, curr) => acc + (curr.advance || 0), 0);
  const netLaborPayable = Math.max(0, totalLaborCost - totalLaborAdvance);
  const netProfitMargin = totalAmount - totalLaborCost - (dieselCost || 0);

  // Show temporary toast message
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Fetch saved records
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hours-rent");
      const data = await res.json();
      if (data.success) {
        setSavedRecords(data.data);
      }
    } catch (err) {
      console.error("Error fetching hours rent entries:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch system employees roster
  const fetchSystemEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSystemEmployees(data.data);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchSystemEmployees();
  }, []);

  // Update hours for all laborers when top hours change
  const handleUpdateGlobalHours = (newHours: number) => {
    setHours(newHours);
    setLaborWages((prev) =>
      prev.map((item) => ({
        ...item,
        hours: newHours,
        total: Number((item.rate * newHours).toFixed(2)),
      }))
    );
    setNewLaborHours(newHours);
  };

  // Scroll labor list container to bottom
  const scrollToBottomLaborList = () => {
    setTimeout(() => {
      if (laborListRef.current) {
        laborListRef.current.scrollTop = laborListRef.current.scrollHeight;
      }
    }, 100);
  };

  // Laborer row change
  const handleLaborRowChange = (id: string, field: keyof LaborWageItem, val: any) => {
    setLaborWages((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        updated.total = Number((updated.rate * updated.hours).toFixed(2));
        return updated;
      })
    );
  };

  // Quick direct row add
  const handleQuickAddLaborRow = () => {
    const nextNum = laborWages.filter((l) => l.name.startsWith("Lab-")).length + 1;
    const newId = `lab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newItem: LaborWageItem = {
      id: newId,
      name: `Lab-${nextNum}`,
      rate: 130,
      hours: hours,
      advance: 0,
      total: 130 * hours,
    };
    setLaborWages((prev) => [...prev, newItem]);
    scrollToBottomLaborList();
    showToast(`Added Lab-${nextNum} to list`);
  };

  // Unique saved parties for auto-complete and modal selection
  const uniqueSavedParties = Array.from(
    new Set(savedRecords.map((r) => r.partyName).filter(Boolean))
  );

  // Open Modal to Add / Select Party
  const handleOpenAddPartyModal = () => {
    setNewPartyNameInput(partyName || "");
    setNewPartyPhoneInput("");
    setNewPartyEmailInput("");
    setNewPartyAddressInput("");
    setIsAddPartyModalOpen(true);
  };

  // Submit Add Party Modal
  const handleAddPartySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nameToSet = newPartyNameInput.trim();
    if (!nameToSet) return;

    setPartyName(nameToSet);
    setIsAddPartyModalOpen(false);
    showToast(`Party / Client updated to "${nameToSet}"`);
  };

  // Open Modal to Add Laborer
  const handleOpenAddLaborModal = () => {
    const nextNum = laborWages.filter((l) => l.name.startsWith("Lab-")).length + 1;
    setNewLaborName(`Lab-${nextNum}`);
    setNewLaborRate(130);
    setNewLaborHours(hours);
    setNewLaborAdvance(0);
    setSelectedSystemEmp("");
    setShowCreateEmpSection(false);
    setIsAddLaborModalOpen(true);
  };

  // Select employee from system roster in modal
  const handleSelectSystemEmp = (empName: string) => {
    setSelectedSystemEmp(empName);
    setNewLaborName(empName);
  };

  // Submit Add Laborer Modal
  const handleAddLaborerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nameToAdd = newLaborName.trim();
    if (!nameToAdd) return;

    const newId = `lab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newItem: LaborWageItem = {
      id: newId,
      name: nameToAdd,
      rate: Number(newLaborRate) || 130,
      hours: Number(newLaborHours) || hours,
      advance: Number(newLaborAdvance) || 0,
      total: Number((Number(newLaborRate || 130) * Number(newLaborHours || hours)).toFixed(2)),
    };

    setLaborWages((prev) => [...prev, newItem]);
    setIsAddLaborModalOpen(false);
    scrollToBottomLaborList();
    showToast(`Added "${nameToAdd}" to labor wages breakdown`);
  };

  // Create new employee directly into system database
  const handleCreateNewSystemEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empCreateName.trim()) return;

    setCreatingEmp(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: empCreateName.trim(),
          role: empCreateRole || "Laborer",
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Employee "${empCreateName.trim()}" added to database!`);
        setNewLaborName(empCreateName.trim());
        setSelectedSystemEmp(empCreateName.trim());
        setEmpCreateName("");
        setShowCreateEmpSection(false);
        fetchSystemEmployees();
      } else {
        alert(data.error || "Failed to create employee");
      }
    } catch (err) {
      console.error("Error creating employee:", err);
    } finally {
      setCreatingEmp(false);
    }
  };

  // Delete laborer row
  const handleDeleteLaborRow = (id: string) => {
    if (laborWages.length <= 1) {
      alert("At least one laborer/operator row is required.");
      return;
    }
    setLaborWages((prev) => prev.filter((item) => item.id !== id));
  };

  // Save Entry to Ledger
  const handleSaveToLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        date,
        partyName,
        pricePerHour: Number(pricePerHour),
        hours: Number(hours),
        padiPaid: Number(padiPaid),
        dieselCost: Number(dieselCost || 0),
        dieselLiters: Number(dieselLiters || 0),
        laborWages: laborWages.map((w) => ({
          name: w.name,
          rate: Number(w.rate),
          hours: Number(w.hours),
          advance: Number(w.advance || 0),
          total: Number(w.rate * w.hours),
        })),
      };

      const res = await fetch("/api/hours-rent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast("Hours Rent & Labor Splitter entry saved to Ledger successfully!");
        fetchRecords();
      } else {
        alert(data.error || "Failed to save entry");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete record
  const handleDeleteRecord = async (rentId: string) => {
    if (!confirm("Are you sure you want to delete this Hours Rent entry?")) return;
    try {
      const res = await fetch(`/api/hours-rent/${rentId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Entry deleted successfully.");
        fetchRecords();
      } else {
        alert(data.error || "Failed to delete record");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Slip Modal for printing
  const handleOpenPrintSlip = (record?: HoursRentRecord) => {
    if (record) {
      setActiveSlipRecord({
        ...record,
        dieselCost: record.dieselCost || 0,
        dieselLiters: record.dieselLiters || 0,
      });
    } else {
      setActiveSlipRecord({
        rentId: `RENT-PREVIEW`,
        date,
        partyName,
        pricePerHour,
        hours,
        totalAmount,
        padiPaid,
        netBalance,
        laborWages: laborWages.map((w) => ({ ...w, advance: w.advance || 0, total: w.rate * w.hours })),
        totalLaborCost,
        dieselCost: Number(dieselCost || 0),
        dieselLiters: Number(dieselLiters || 0),
        netProfitMargin,
        createdAt: new Date().toISOString(),
      });
    }
    setIsPrintModalOpen(true);
  };

  // Download slip document as PDF (.pdf file)
  const handleDownloadSlip = async () => {
    const content = slipPrintRef.current;
    if (!content || !activeSlipRecord) return;

    const partySanitized = activeSlipRecord.partyName.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `Hours_Rent_Slip_${partySanitized}_${activeSlipRecord.date}.pdf`;

    await downloadElementAsPDF(content, filename);
  };

  const filteredRecords = savedRecords.filter(
    (r) =>
      r.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.date.includes(searchTerm) ||
      r.rentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 py-4 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      {/* Dynamic Datalists for Employee & Party Auto-complete */}
      <datalist id="employee-roster-list">
        {systemEmployees.map((emp, i) => (
          <option key={emp._id || emp.employeeId || i} value={emp.name}>
            {emp.name} {emp.role ? `(${emp.role})` : ""}
          </option>
        ))}
      </datalist>

      <datalist id="party-client-list">
        {uniqueSavedParties.map((pName, i) => (
          <option key={i} value={pName}>
            {pName}
          </option>
        ))}
      </datalist>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 border border-amber-400/30 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-amber-200" />
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-amber-900/20 via-amber-600/10 to-transparent p-6 rounded-3xl border border-amber-500/30 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Interactive Dual-Column Machinery & Wage Allocator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-amber-100">
            Hours Rent & Labor Splitter
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Split machinery hours rental billing (Party ledger) on the left side and operator/labor wage allocations on the right side.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={handleOpenAddPartyModal}
            className="flex-1 md:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 text-xs sm:text-sm font-semibold border border-amber-500/30 transition-all"
          >
            <UserPlus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>+ Add Party</span>
          </button>

          <button
            onClick={handleOpenAddLaborModal}
            className="flex-1 md:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 text-xs sm:text-sm font-semibold border border-amber-500/30 transition-all"
          >
            <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>+ Add Laborer</span>
          </button>
        </div>
      </div>

      {/* Main Splitter Section Form */}
      <form onSubmit={handleSaveToLedger} className="space-y-6">
        <div
          onMouseMove={handleCardMouseMove}
          className="glass-panel p-6 sm:p-8 rounded-3xl border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent relative shadow-2xl overflow-hidden"
        >
          {/* Handwritten Sketch Title Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-amber-500/20 pb-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold gold-text-gradient tracking-wide uppercase">
                Hours Rent & Wage Allocation Splitter Sheet
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                Live Interactive Calculation & Dual-Column Splitter
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenPrintSlip()}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-amber-600/20 transition-all shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download Current Slip</span>
            </button>
          </div>

          {/* TWO COLUMN SPLITTER CONTAINER */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
            {/* Vertical Splitter Divider Line (visible on desktop) */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500/50 via-amber-500/20 to-transparent -translate-x-1/2 pointer-events-none" />

            {/* LEFT COLUMN: Hours Rent Billing & Party Ledger */}
            <div className="space-y-5 lg:pr-6">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-base font-serif font-bold text-amber-900 dark:text-amber-100 uppercase tracking-wider">
                    Left Column: Hours. Rent.
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddPartyModal}
                  className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow flex items-center space-x-1 transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Party</span>
                </button>
              </div>

              {/* Date Input */}
              <div className="space-y-1">
                <label className="text-xs font-serif font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                  <span>Date:</span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono text-[11px]">(click)</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/80 dark:bg-black/60 border border-amber-500/30 text-sm font-mono font-bold text-slate-900 dark:text-amber-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Party Name Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-serif font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                    <span className="text-amber-500">*</span>
                    <span>Party / Client Name:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenAddPartyModal}
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Add / Select Party</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  list="party-client-list"
                  placeholder="e.g. Selvaraj"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 dark:bg-black/60 border border-amber-500/30 text-sm font-bold text-slate-900 dark:text-amber-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Rate & Hours Calculation ({ Price x Hours }) */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <span className="text-xs font-serif font-bold text-amber-900 dark:text-amber-200 block">
                  &#123; Price × Hours Formula &#125;
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Price per Hour (₹) (1300)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={pricePerHour}
                      onChange={(e) => setPricePerHour(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/60 border border-amber-500/30 text-sm font-mono font-bold text-slate-900 dark:text-amber-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Hours Worked ({hours}h)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={hours}
                      onChange={(e) => handleUpdateGlobalHours(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/60 border border-amber-500/30 text-sm font-mono font-bold text-slate-900 dark:text-amber-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Amount Output */}
                <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 font-mono">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">Gross Amount ⇒</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-amber-100">
                    ₹{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Padi Input (Paid / Advance) */}
              <div className="space-y-1">
                <label className="text-xs font-serif font-bold text-slate-700 dark:text-slate-300">
                  Padi (Advance Paid) (₹):
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={padiPaid}
                  onChange={(e) => setPadiPaid(Number(e.target.value))}
                  placeholder="3000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 dark:bg-black/60 border border-amber-500/30 text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Net Balance (to Ledger) Result */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg space-y-1">
                <span className="text-xs font-mono tracking-wider opacity-90 uppercase block font-semibold">
                  Net-bal. = (to Ledger)
                </span>
                <span className="text-2xl font-serif font-bold block">
                  ₹{netBalance.toLocaleString()}/-
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN: Operator & Labor Wages Breakdown */}
            <div className="space-y-5 lg:pl-6">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-base font-serif font-bold text-amber-900 dark:text-amber-100 uppercase tracking-wider">
                    Right Column: Labor Wages Splitter
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleQuickAddLaborRow}
                    className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition flex items-center space-x-1"
                    title="Quick add lab row"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Quick Row</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenAddLaborModal}
                    className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow flex items-center space-x-1 transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Laborer</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Laborer Rows */}
              <div
                ref={laborListRef}
                className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 scroll-smooth"
              >
                {laborWages.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-white/60 dark:bg-black/40 border border-amber-500/20 flex items-center justify-between gap-2 transition-all hover:border-amber-500/40"
                  >
                    {/* Name Input with Autocomplete Datalist */}
                    <div className="relative shrink-0">
                      <input
                        type="text"
                        required
                        list="employee-roster-list"
                        value={item.name}
                        onChange={(e) => handleLaborRowChange(item.id, "name", e.target.value)}
                        placeholder="Operator / Laborer"
                        className="w-28 sm:w-32 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/30 text-xs font-bold text-slate-900 dark:text-amber-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Formula Inputs (Rate x Hours - Advance) */}
                    <div className="flex items-center space-x-1 font-mono text-xs flex-wrap sm:flex-nowrap gap-y-1">
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          min="0"
                          title="Rate per hour"
                          value={item.rate}
                          onChange={(e) => handleLaborRowChange(item.id, "rate", Number(e.target.value))}
                          className="w-14 px-1.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-500/30 text-center font-bold text-slate-900 dark:text-amber-100"
                        />
                        <span className="text-slate-400">×</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          title="Hours worked"
                          value={item.hours}
                          onChange={(e) => handleLaborRowChange(item.id, "hours", Number(e.target.value))}
                          className="w-11 px-1 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-500/30 text-center font-bold text-slate-900 dark:text-amber-100"
                        />
                        <span className="text-slate-400">h</span>
                      </div>

                      {/* Advance Input Option */}
                      <div className="flex items-center space-x-1 pl-1 border-l border-amber-500/20">
                        <span className="text-[10px] text-amber-700 dark:text-amber-300 font-sans font-semibold">Adv:</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          title="Advance amount received/paid"
                          value={item.advance || ""}
                          onChange={(e) => handleLaborRowChange(item.id, "advance", e.target.value === "" ? 0 : Number(e.target.value))}
                          className="w-16 px-1.5 py-1 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/40 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Total Output & Net Payable */}
                    <div className="text-right min-w-[65px]">
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-300 text-xs block">
                        ₹{(item.rate * item.hours).toLocaleString()}
                      </span>
                      {(item.advance || 0) > 0 && (
                        <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                          Net: ₹{Math.max(0, item.rate * item.hours - item.advance).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteLaborRow(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                      title="Remove laborer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Total Labor Wages Breakdown */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex justify-between items-center text-xs font-serif font-bold text-slate-700 dark:text-slate-300">
                  <span>Total Gross Labor Wages ({laborWages.length} personnel):</span>
                  <span className="font-mono text-base text-rose-600 dark:text-rose-400 font-bold">
                    ₹{totalLaborCost.toLocaleString()}
                  </span>
                </div>
                {totalLaborAdvance > 0 && (
                  <div className="flex justify-between items-center text-xs font-serif font-bold text-emerald-700 dark:text-emerald-400 pt-1 border-t border-amber-500/20">
                    <span>Total Labor Advance Paid:</span>
                    <span className="font-mono text-sm font-bold">
                      - ₹{totalLaborAdvance.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs font-serif font-bold text-amber-900 dark:text-amber-100 pt-1 border-t border-amber-500/20">
                  <span>Net Labor Payable Due:</span>
                  <span className="font-mono text-sm text-amber-600 dark:text-amber-300 font-bold">
                    ₹{netLaborPayable.toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Operator ({laborWages.find((l) => l.name === "Operator")?.rate || 140} × {hours}h) + Laborers wages & advances
                </p>
              </div>

              {/* Diesel Expense Input Card */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-serif font-bold text-slate-800 dark:text-amber-100 block">
                      Diesel Price / Expense (₹):
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Included on every single PDF slip & deducted from margin
                    </span>
                  </div>
                  <div className="relative shrink-0 w-32">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={dieselCost || ""}
                      onChange={(e) => setDieselCost(e.target.value === "" ? 0 : Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-black/60 border border-amber-500/40 text-sm font-mono font-bold text-amber-700 dark:text-amber-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-amber-500/20 text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Diesel Liters (L) (Optional):</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 10 L"
                    value={dieselLiters || ""}
                    onChange={(e) => setDieselLiters(e.target.value === "" ? 0 : Number(e.target.value))}
                    className="w-28 px-2 py-1 rounded-lg bg-white dark:bg-black/60 border border-amber-500/30 text-xs font-mono font-bold text-slate-900 dark:text-amber-100 text-center"
                  />
                </div>
              </div>

              {/* Combined Job Net Margin Summary */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-serif font-bold text-emerald-900 dark:text-emerald-300 block">
                    Estimated Net Job Margin / Profit:
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Gross Billing (₹{totalAmount.toLocaleString()}) - Labor (₹{totalLaborCost.toLocaleString()}) {dieselCost > 0 ? `- Diesel (₹${dieselCost.toLocaleString()})` : ""}
                  </span>
                </div>
                <span className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{netProfitMargin.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 pt-6 border-t border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-serif">
              Clicking <strong className="text-amber-700 dark:text-amber-300">Save & Sync</strong> will persist this entry to your company ledger database.
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleOpenPrintSlip()}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500/20 text-white dark:text-amber-200 border border-amber-500/30 text-xs font-semibold flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Slip Preview</span>
              </button>

              <button
                type="submit"
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20 flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save & Sync to Ledger</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Saved Hours Rent Ledger Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100">
              Hours Rent Splitter Ledger History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Saved hours rental entries and labor wage allocation records.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Party Name, Date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/80 dark:bg-black/60 border border-amber-500/20 text-xs sm:text-sm focus:outline-none focus:border-amber-500 text-slate-900 dark:text-amber-100"
            />
          </div>
        </div>

        <div className="glass-panel rounded-3xl overflow-hidden border-amber-500/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-amber-500/10 text-amber-900 dark:text-amber-200 font-serif font-semibold border-b border-amber-500/20">
                <tr>
                  <th className="p-4">Party / Client</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Formula (Price × Hrs)</th>
                  <th className="p-4">Gross Amount</th>
                  <th className="p-4">Padi (Advance)</th>
                  <th className="p-4">Net Balance (Due)</th>
                  <th className="p-4">Labor Cost</th>
                  <th className="p-4">Diesel Cost</th>
                  <th className="p-4">Net Margin</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/60 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500 font-serif">
                      Loading hours rent ledger entries...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      No saved hours rent records found. Fill the form above to log an entry.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item) => (
                    <tr key={item.rentId} className="hover:bg-amber-500/5 transition-colors">
                      <td className="p-4 font-semibold text-slate-900 dark:text-amber-100">
                        <div>
                          <span className="block font-bold">{item.partyName}</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono font-normal">
                            ID: {item.rentId}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {item.date}
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                        ₹{item.pricePerHour} × {item.hours}h
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-amber-100">
                        ₹{item.totalAmount.toLocaleString()}
                      </td>
                      <td className="p-4 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        ₹{item.padiPaid.toLocaleString()}
                      </td>
                      <td className="p-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                        ₹{item.netBalance.toLocaleString()}
                      </td>
                      <td className="p-4 font-mono text-rose-600 dark:text-rose-400">
                        ₹{item.totalLaborCost.toLocaleString()}
                      </td>
                      <td className="p-4 font-mono text-amber-600 dark:text-amber-400 font-semibold">
                        ₹{(item.dieselCost || 0).toLocaleString()}
                      </td>
                      <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{item.netProfitMargin.toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenPrintSlip(item)}
                            className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-all"
                            title="Download Slip"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(item.rentId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- ADD PARTY / CLIENT MODAL --- */}
      {isAddPartyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-lg p-6 sm:p-7 rounded-3xl border-amber-500/40 relative shadow-2xl bg-white dark:bg-[#0E0C12] text-slate-900 dark:text-amber-100">
            <button
              onClick={() => setIsAddPartyModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-amber-200 transition p-1.5 rounded-full hover:bg-amber-500/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 border-b border-amber-500/20 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-amber-900 dark:text-amber-100">
                  Add / Select Party or Client
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select from existing saved client roster or enter new Party / Client details
                </p>
              </div>
            </div>

            <form onSubmit={handleAddPartySubmit} className="space-y-4">
              {/* Quick Select from Saved Unique Parties */}
              {uniqueSavedParties.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-amber-200 flex items-center justify-between">
                    <span>Quick Select Saved Party / Client:</span>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                      ({uniqueSavedParties.length} saved)
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    {uniqueSavedParties.map((pName, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNewPartyNameInput(pName)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                          newPartyNameInput === pName
                            ? "bg-amber-600 text-white shadow"
                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-amber-200 border border-amber-500/20 hover:border-amber-500/50"
                        }`}
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>{pName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Party / Client Name Input */}
              <div className="space-y-1">
                <label className="text-xs font-serif font-bold text-slate-700 dark:text-amber-200">
                  Party / Client Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                  <input
                    type="text"
                    required
                    list="party-client-list"
                    placeholder="e.g. Selvaraj / Horizon Builders"
                    value={newPartyNameInput}
                    onChange={(e) => setNewPartyNameInput(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/90 dark:bg-black/60 border border-amber-500/30 text-sm font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Optional Contact Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={newPartyPhoneInput}
                      onChange={(e) => setNewPartyPhoneInput(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-black/60 border border-amber-500/20 text-xs font-mono font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      placeholder="client@example.com"
                      value={newPartyEmailInput}
                      onChange={(e) => setNewPartyEmailInput(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-black/60 border border-amber-500/20 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Site Address */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
                  Site / Delivery Address (Optional)
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Site 4B, Industrial Zone, Madurai"
                    value={newPartyAddressInput}
                    onChange={(e) => setNewPartyAddressInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-black/60 border border-amber-500/20 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-amber-500/20">
                <button
                  type="button"
                  onClick={() => setIsAddPartyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-amber-500/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPartyNameInput.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Party to Sheet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD LABORER MODAL --- */}
      {isAddLaborModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-lg p-6 sm:p-7 rounded-3xl border-amber-500/40 relative shadow-2xl bg-white dark:bg-[#0E0C12] text-slate-900 dark:text-amber-100">
            <button
              onClick={() => setIsAddLaborModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-amber-200 transition p-1.5 rounded-full hover:bg-amber-500/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 border-b border-amber-500/20 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-amber-900 dark:text-amber-100">
                  Add Laborer / Operator Allocation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select from system staff roster or enter custom personnel wage details
                </p>
              </div>
            </div>

            <form onSubmit={handleAddLaborerSubmit} className="space-y-4">
              {/* Select from system roster pills if available */}
              {systemEmployees.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-amber-200 flex items-center justify-between">
                    <span>Quick Select System Employee Roster:</span>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                      ({systemEmployees.length} staff)
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    {systemEmployees.map((emp) => (
                      <button
                        key={emp._id || emp.employeeId}
                        type="button"
                        onClick={() => handleSelectSystemEmp(emp.name)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
                          selectedSystemEmp === emp.name
                            ? "bg-amber-600 text-white shadow"
                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-amber-200 border border-amber-500/20 hover:border-amber-500/50"
                        }`}
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>{emp.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Laborer Name */}
              <div className="space-y-1">
                <label className="text-xs font-serif font-bold text-slate-700 dark:text-amber-200">
                  Laborer / Operator Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="employee-roster-list"
                  placeholder="e.g. Ramesh / Lab-5"
                  value={newLaborName}
                  onChange={(e) => {
                    setNewLaborName(e.target.value);
                    setSelectedSystemEmp("");
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/90 dark:bg-black/60 border border-amber-500/30 text-sm font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Wage Calculation (Rate x Hours & Advance) */}
              <div className="grid grid-cols-3 gap-2 bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Rate (₹/hr)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={newLaborRate}
                    onChange={(e) => setNewLaborRate(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-black/60 border border-amber-500/30 text-xs font-mono font-bold text-slate-900 dark:text-amber-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Hours Worked
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={newLaborHours}
                    onChange={(e) => setNewLaborHours(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-black/60 border border-amber-500/30 text-xs font-mono font-bold text-slate-900 dark:text-amber-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 block mb-1">
                    Advance (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={newLaborAdvance || ""}
                    onChange={(e) => setNewLaborAdvance(e.target.value === "" ? 0 : Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Calculated preview */}
              <div className="flex items-center justify-between px-2 text-xs font-mono">
                <span className="text-slate-500 dark:text-slate-400">Total Wage Allocation:</span>
                <span className="text-base font-bold text-amber-600 dark:text-amber-300">
                  ₹{(Number(newLaborRate || 0) * Number(newLaborHours || 0)).toLocaleString()}
                </span>
              </div>

              {/* Toggle Add to System Database Roster */}
              <div className="pt-2 border-t border-amber-500/20">
                {!showCreateEmpSection ? (
                  <button
                    type="button"
                    onClick={() => setShowCreateEmpSection(true)}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Want to add this person to permanent System DB Employee roster?</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        Create New System Employee Roster Record
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCreateEmpSection(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Employee Name"
                        value={empCreateName}
                        onChange={(e) => setEmpCreateName(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/60 border border-amber-500/30 text-xs font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Role (e.g. Mason / Helper)"
                        value={empCreateRole}
                        onChange={(e) => setEmpCreateRole(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/60 border border-amber-500/30 text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={creatingEmp || !empCreateName.trim()}
                      onClick={handleCreateNewSystemEmployee}
                      className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold disabled:opacity-50 transition"
                    >
                      {creatingEmp ? "Adding to DB..." : "Save to Employee Database"}
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-amber-500/20">
                <button
                  type="button"
                  onClick={() => setIsAddLaborModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-amber-500/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newLaborName.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Wage Breakdown</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PRINTABLE SLIP MODAL (Formatted exactly like handwritten design) --- */}
      {isPrintModalOpen && activeSlipRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-xl p-6 rounded-3xl border-amber-500/40 relative shadow-2xl bg-white dark:bg-[#0D0B10]">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-4">
              <h2 className="text-base font-serif font-bold text-amber-900 dark:text-amber-100">
                Hours Rent Job Splitter Slip Preview
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownloadSlip}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Slip</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Slip Printable Content (mirroring handwritten sheet) */}
            <div ref={slipPrintRef} className="p-4 bg-white dark:bg-[#0D0B10] font-mono text-xs">
              <div className="text-center font-serif font-bold text-lg text-amber-900 dark:text-amber-100 mb-3 border-b-2 border-amber-600/30 pb-2">
                ELYON TRADERS — HOURS RENT SLIP
              </div>

              <div className="grid grid-cols-2 gap-4 relative">
                {/* Vertical Divider */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-black/40 -translate-x-1/2" />

                {/* Left Side */}
                <div className="space-y-2 pr-2">
                  <div className="font-bold text-sm underline mb-1">Hours. Rent.</div>
                  <div>Date :- {activeSlipRecord.date}</div>
                  <div>* Party :- {activeSlipRecord.partyName}</div>
                  <div className="pt-2">
                    &#123; Price × Hours &#125;<br />
                    ({activeSlipRecord.pricePerHour}) × ({activeSlipRecord.hours}h)
                  </div>
                  <div className="border-t border-black pt-1 font-bold">
                    Amount ⇒ {activeSlipRecord.totalAmount}
                  </div>
                  <div>Padi ⇒ {activeSlipRecord.padiPaid}</div>
                  <div className="border-t border-b border-black py-1 font-bold text-sm">
                    Net-bal. = {activeSlipRecord.netBalance}/- Ledger
                  </div>
                </div>

                {/* Right Side */}
                <div className="space-y-1.5 pl-2">
                  <div className="font-bold text-sm underline mb-1 font-sans">Labor & Expenses Breakdown</div>
                  {activeSlipRecord.laborWages.map((w, i) => (
                    <div key={i} className="flex justify-between text-[11px]">
                      <span>{w.name}:</span>
                      <span>
                        {w.rate} × {w.hours} = {w.total}
                        {(w.advance || 0) > 0 ? ` (Adv: ₹${w.advance})` : ""}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-black pt-1 font-bold flex justify-between">
                    <span>Total Labor:</span>
                    <span>₹{activeSlipRecord.totalLaborCost}</span>
                  </div>

                  {/* Diesel Price Expense Line Item - Always included on every PDF */}
                  <div className="border-t border-b border-black py-1.5 my-1.5 font-bold text-xs bg-amber-500/5 px-1">
                    <div className="flex justify-between">
                      <span>Diesel Price / Fuel Expense:</span>
                      <span>₹{activeSlipRecord.dieselCost || 0}</span>
                    </div>
                    {activeSlipRecord.dieselLiters && activeSlipRecord.dieselLiters > 0 ? (
                      <div className="text-[10px] text-slate-600 font-normal font-sans mt-0.5">
                        Fuel Quantity: {activeSlipRecord.dieselLiters} Liters
                      </div>
                    ) : null}
                  </div>

                  <div className="font-bold flex justify-between text-xs text-rose-700 dark:text-rose-400 pt-0.5">
                    <span>Total Expenses (Labor + Diesel):</span>
                    <span>₹{(activeSlipRecord.totalLaborCost + (activeSlipRecord.dieselCost || 0)).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t-2 border-amber-600/30 text-center font-bold">
                <div className="text-sm">Net Job Margin: ₹{activeSlipRecord.netProfitMargin}</div>
                <div className="text-[10px] font-sans font-normal text-slate-500 mt-0.5">
                  (Gross Amount ₹{activeSlipRecord.totalAmount} - Labor Cost ₹{activeSlipRecord.totalLaborCost} - Diesel Expense ₹{activeSlipRecord.dieselCost || 0})
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
