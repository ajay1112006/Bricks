"use client";

import { useState, useEffect, useRef } from "react";
import {
  Clock,
  UserCheck,
  DollarSign,
  Plus,
  Trash2,
  Printer,
  Save,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Users,
  Building2,
  X
} from "lucide-react";
import { handleCardMouseMove } from "@/lib/useSpotlight";
import TransparentLogo from "@/components/TransparentLogo";

interface LaborWageItem {
  name: string;
  rate: number;
  hours: number;
  total: number;
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

  // Right Column: Operator & Labor List
  const [laborWages, setLaborWages] = useState<LaborWageItem[]>([
    { name: "Operator", rate: 140, hours: 8, total: 1120 },
    { name: "Lab-1", rate: 130, hours: 8, total: 1040 },
    { name: "Lab-2", rate: 130, hours: 8, total: 1040 },
    { name: "Lab-3", rate: 130, hours: 8, total: 1040 },
    { name: "Lab-4", rate: 130, hours: 8, total: 1040 },
  ]);

  // Saved Records
  const [savedRecords, setSavedRecords] = useState<HoursRentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  // Printable Slip Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activeSlipRecord, setActiveSlipRecord] = useState<HoursRentRecord | null>(null);
  const slipPrintRef = useRef<HTMLDivElement>(null);

  // Calculated values
  const totalAmount = Number((pricePerHour * hours).toFixed(2));
  const netBalance = Math.max(0, Number((totalAmount - padiPaid).toFixed(2)));

  // Recalculate labor totals
  const totalLaborCost = laborWages.reduce((acc, curr) => acc + curr.rate * curr.hours, 0);
  const netProfitMargin = totalAmount - totalLaborCost;

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

  useEffect(() => {
    fetchRecords();
  }, []);

  // Update hours for all laborers when top hours change
  const handleUpdateGlobalHours = (newHours: number) => {
    setHours(newHours);
    setLaborWages((prev) =>
      prev.map((item) => ({
        ...item,
        hours: newHours,
        total: item.rate * newHours,
      }))
    );
  };

  // Laborer row change
  const handleLaborRowChange = (index: number, field: keyof LaborWageItem, val: any) => {
    setLaborWages((prev) => {
      const copy = [...prev];
      const updatedItem = { ...copy[index], [field]: val };
      updatedItem.total = Number((updatedItem.rate * updatedItem.hours).toFixed(2));
      copy[index] = updatedItem;
      return copy;
    });
  };

  // Add new laborer row
  const handleAddLaborRow = () => {
    const nextNum = laborWages.filter((l) => l.name.startsWith("Lab-")).length + 1;
    setLaborWages((prev) => [
      ...prev,
      { name: `Lab-${nextNum}`, rate: 130, hours: hours, total: 130 * hours },
    ]);
  };

  // Delete laborer row
  const handleDeleteLaborRow = (index: number) => {
    if (laborWages.length <= 1) return;
    setLaborWages((prev) => prev.filter((_, i) => i !== index));
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
        laborWages: laborWages.map((w) => ({
          name: w.name,
          rate: Number(w.rate),
          hours: Number(w.hours),
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
        alert("Hours Rent & Labor Splitter entry saved to Ledger successfully!");
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
      setActiveSlipRecord(record);
    } else {
      // Create record from current form state
      setActiveSlipRecord({
        rentId: `RENT-PREVIEW`,
        date,
        partyName,
        pricePerHour,
        hours,
        totalAmount,
        padiPaid,
        netBalance,
        laborWages: laborWages.map((w) => ({ ...w, total: w.rate * w.hours })),
        totalLaborCost,
        netProfitMargin,
        createdAt: new Date().toISOString(),
      });
    }
    setIsPrintModalOpen(true);
  };

  // Trigger browser print for slip
  const handlePrintSlip = () => {
    const content = slipPrintRef.current;
    if (!content) return;

    const printWin = window.open("", "_blank");
    if (!printWin) {
      alert("Please allow popups to print slip.");
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hours Rent & Labor Slip - Elyon Traders</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 25px; color: #000; background: #fff; width: 650px; margin: 0 auto; }
            .border-box { border: 3px double #000; padding: 20px; }
            .title { text-align: center; font-size: 22px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px; }
            .splitter-table { width: 100%; border-collapse: collapse; }
            .splitter-table td { vertical-align: top; width: 50%; padding: 10px; }
            .left-col { border-right: 2px solid #000; }
            .field-row { margin-bottom: 12px; font-size: 14px; font-weight: bold; }
            .line { border-bottom: 1.5px solid #000; margin: 10px 0; }
            .grand-net { font-size: 18px; font-weight: bold; text-align: center; margin-top: 15px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px 0; }
          </style>
        </head>
        <body>
          <div class="border-box">
            ${content.innerHTML}
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const filteredRecords = savedRecords.filter(
    (r) =>
      r.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.date.includes(searchTerm) ||
      r.rentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 py-4 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-amber-900/20 via-amber-600/10 to-transparent p-6 rounded-3xl border border-amber-500/30 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Interactive Handwritten Design Layout</span>
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
            onClick={() => handleOpenPrintSlip()}
            className="flex-1 md:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-amber-600/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Current Slip</span>
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
          <div className="text-center border-b border-amber-500/20 pb-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-serif font-bold gold-text-gradient tracking-wide uppercase">
              Hours Rent & Wage Allocation Splitter Sheet
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              Live Interactive Calculation & Dual-Column Splitter
            </p>
          </div>

          {/* TWO COLUMN SPLITTER CONTAINER */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
            {/* Vertical Splitter Divider Line (visible on desktop) */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500/50 via-amber-500/20 to-transparent -translate-x-1/2 pointer-events-none" />

            {/* LEFT COLUMN: Hours Rent Billing & Party Ledger */}
            <div className="space-y-5 lg:pr-6">
              <div className="flex items-center space-x-2 border-b border-amber-500/20 pb-2">
                <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-base font-serif font-bold text-amber-900 dark:text-amber-100 uppercase tracking-wider">
                  Left Column: Hours. Rent.
                </h3>
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
                <label className="text-xs font-serif font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                  <span className="text-amber-500">*</span>
                  <span>Party / Client Name:</span>
                </label>
                <input
                  type="text"
                  required
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
                      step="50"
                      required
                      value={pricePerHour}
                      onChange={(e) => setPricePerHour(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/60 border border-amber-500/30 text-sm font-mono font-bold text-slate-900 dark:text-amber-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Hours Worked (8)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
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

                <button
                  type="button"
                  onClick={handleAddLaborRow}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-500/20 flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Laborer</span>
                </button>
              </div>

              {/* Dynamic Laborer Rows */}
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {laborWages.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white/60 dark:bg-black/40 border border-amber-500/20 flex items-center justify-between gap-2"
                  >
                    {/* Name */}
                    <input
                      type="text"
                      required
                      value={item.name}
                      onChange={(e) => handleLaborRowChange(idx, "name", e.target.value)}
                      placeholder="Operator / Lab-1"
                      className="w-28 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/30 text-xs font-bold text-slate-900 dark:text-amber-100 focus:outline-none"
                    />

                    {/* Formula Inputs (Rate x Hours) */}
                    <div className="flex items-center space-x-1 font-mono text-xs">
                      <input
                        type="number"
                        min="0"
                        value={item.rate}
                        onChange={(e) => handleLaborRowChange(idx, "rate", Number(e.target.value))}
                        className="w-16 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-500/30 text-center font-bold"
                      />
                      <span>×</span>
                      <input
                        type="number"
                        min="1"
                        value={item.hours}
                        onChange={(e) => handleLaborRowChange(idx, "hours", Number(e.target.value))}
                        className="w-12 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-500/30 text-center font-bold"
                      />
                      <span>hrs =</span>
                    </div>

                    {/* Total Output */}
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-300 text-xs">
                      ₹{(item.rate * item.hours).toLocaleString()}
                    </span>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteLaborRow(idx)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Total Labor Wages Breakdown */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex justify-between items-center text-xs font-serif font-bold text-slate-700 dark:text-slate-300">
                  <span>Total Labor Expenses:</span>
                  <span className="font-mono text-base text-rose-600 dark:text-rose-400 font-bold">
                    ₹{totalLaborCost.toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Operator ({laborWages.find((l) => l.name === "Operator")?.rate || 140} × {hours}h) + Laborers wages
                </p>
              </div>

              {/* Combined Job Net Margin Summary */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-serif font-bold text-emerald-900 dark:text-emerald-300 block">
                    Estimated Net Job Margin / Profit:
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Gross Billing (₹{totalAmount.toLocaleString()}) - Labor Cost (₹{totalLaborCost.toLocaleString()})
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
                <Printer className="w-4 h-4" />
                <span>Preview Slip</span>
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
                  <th className="p-4">Net Margin</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/60 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 font-serif">
                      Loading hours rent ledger entries...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
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
                      <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{item.netProfitMargin.toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenPrintSlip(item)}
                            className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-all"
                            title="Print Slip"
                          >
                            <Printer className="w-4 h-4" />
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
                  onClick={handlePrintSlip}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
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
                  <div className="font-bold text-sm underline mb-1 font-sans">Labor & Operator Breakdown</div>
                  {activeSlipRecord.laborWages.map((w, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{w.name}:</span>
                      <span>{w.rate} × {w.hours} = {w.total}</span>
                    </div>
                  ))}
                  <div className="border-t border-black pt-1 font-bold flex justify-between">
                    <span>Total Labor:</span>
                    <span>₹{activeSlipRecord.totalLaborCost}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t-2 border-amber-600/30 text-center font-bold">
                Net Job Margin: ₹{activeSlipRecord.netProfitMargin}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
