"use client";

import { useState, useEffect } from "react";
import { Sliders, X, IndianRupee, Calculator, AlertCircle, Save, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

interface Order {
  orderId: string;
  customerName: string;
  revenue: number;
  costs: {
    materials: number;
    labor: number;
    overhead: number;
    shipping: number;
  };
  marginAdjustment: number;
  netProfit: number;
  profitMarginPercent: number;
  notes?: string;
  status: string;
}

interface CalibrationModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onCalibrated: () => void;
}

export default function CalibrationModal({
  isOpen,
  order,
  onClose,
  onCalibrated,
}: CalibrationModalProps) {
  const [revenue, setRevenue] = useState<number>(0);
  const [materials, setMaterials] = useState<number>(0);
  const [labor, setLabor] = useState<number>(0);
  const [overhead, setOverhead] = useState<number>(0);
  const [shipping, setShipping] = useState<number>(0);
  const [marginAdjustment, setMarginAdjustment] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  useEffect(() => {
    if (order) {
      setRevenue(order.revenue || 0);
      setMaterials(order.costs?.materials || 0);
      setLabor(order.costs?.labor || 0);
      setOverhead(order.costs?.overhead || 0);
      setShipping(order.costs?.shipping || 0);
      setMarginAdjustment(order.marginAdjustment || 0);
      setNotes(order.notes || "");
      setError("");
      setSuccessMsg("");
    }
  }, [order]);

  if (!isOpen || !order) return null;

  // Live real-time financial calculations
  const totalExpenses = materials + labor + overhead + shipping;
  const calculatedNetProfit = Number((revenue - totalExpenses + marginAdjustment).toFixed(2));
  const calculatedMarginPercent = revenue > 0 ? Number(((calculatedNetProfit / revenue) * 100).toFixed(2)) : 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const payload = {
        revenue,
        costs: {
          materials,
          labor,
          overhead,
          shipping,
        },
        marginAdjustment,
        notes,
      };

      const res = await fetch(`/api/orders/${order.orderId}/calibrate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Calibration update failed");
      }

      setSuccessMsg("P&L Calibrated and saved to MongoDB!");
      setTimeout(() => {
        onCalibrated();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to save calibration");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-2xl p-6 relative shadow-2xl overflow-y-auto max-h-[90vh] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white transition p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Order P&L Calibration Tool</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700">
                {order.orderId}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customer: <span className="text-slate-900 dark:text-slate-200 font-semibold">{order.customerName}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Live Calculation Preview Banner */}
        <div
          className={`p-4 rounded-xl mb-6 border transition-colors ${
            calculatedNetProfit < 0
              ? "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200"
              : calculatedMarginPercent < 10
              ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200"
              : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  calculatedNetProfit < 0
                    ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                    : calculatedMarginPercent < 10
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {calculatedNetProfit < 0 ? (
                  <TrendingDown className="w-5 h-5" />
                ) : (
                  <TrendingUp className="w-5 h-5" />
                )}
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold opacity-80">Calibrated Net Profit</span>
                <p className="text-2xl font-extrabold">{formatCurrency(calculatedNetProfit)}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs uppercase tracking-wider font-semibold opacity-80">Calibrated Margin</span>
              <p className="text-2xl font-extrabold">{calculatedMarginPercent}%</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/40 text-xs flex items-center justify-between opacity-90 font-medium">
            <span>Gross Revenue: {formatCurrency(revenue)}</span>
            <span>Total Expenses: {formatCurrency(totalExpenses)}</span>
            <span>Margin Adj: {formatCurrency(marginAdjustment)}</span>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSave} className="space-y-4">
          {/* Revenue */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Gross Order Revenue (₹)
            </label>
            <div className="relative">
              <IndianRupee className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={revenue}
                onChange={(e) => setRevenue(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>

          {/* Costs Itemized Grid */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Itemized Cost Breakdown
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-medium">Materials Cost (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={materials}
                  onChange={(e) => setMaterials(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-medium">Labor Cost (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={labor}
                  onChange={(e) => setLabor(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-medium">Overhead Cost (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={overhead}
                  onChange={(e) => setOverhead(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-medium">Freight / Shipping (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={shipping}
                  onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Margin Adjustment Tool */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Manual Margin / Rebate Calibration (₹)
              </label>
              <span className="text-xs text-purple-600 dark:text-purple-400 font-mono font-bold">
                {marginAdjustment >= 0 ? `+${formatCurrency(marginAdjustment)}` : formatCurrency(marginAdjustment)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Apply manual bonus rebates (+ positive) or unexpected freight surcharges (- negative) to calibrate exact profit.
            </p>
            <input
              type="number"
              step="any"
              value={marginAdjustment}
              onChange={(e) => setMarginAdjustment(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-purple-700 dark:text-purple-300 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Calibration Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Adjusted shipping surcharge due to fuel hike..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20 transition flex items-center gap-2"
            >
              <Save className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
              <span>{saving ? "Calibrating..." : "Apply Calibration"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
