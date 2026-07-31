"use client";

import { Package, Clock, CheckCircle2, IndianRupee, TrendingUp, Percent } from "lucide-react";
import { handleCardMouseMove } from "@/lib/useSpotlight";

interface OrderMetricsProps {
  totalOrders: number;
  inProgressCount: number;
  deliveredCount: number;
  totalRevenue: number;
  totalNetProfit: number;
  avgMarginPercent: number;
}

export default function OrderMetrics({
  totalOrders,
  inProgressCount,
  deliveredCount,
  totalRevenue,
  totalNetProfit,
  avgMarginPercent,
}: OrderMetricsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {/* Total Orders */}
      <div
        onMouseMove={handleCardMouseMove}
        className="glass-panel glass-panel-hover p-4 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Orders</span>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalOrders}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Tracked in system</span>
        </div>
      </div>

      {/* In Progress Orders */}
      <div
        onMouseMove={handleCardMouseMove}
        className="glass-panel glass-panel-hover p-4 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">In Progress</span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{inProgressCount}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Active fulfillment</span>
        </div>
      </div>

      {/* Delivered Orders */}
      <div
        onMouseMove={handleCardMouseMove}
        className="glass-panel glass-panel-hover p-4 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Delivered</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{deliveredCount}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Completed orders</span>
        </div>
      </div>

      {/* Gross Revenue */}
      <div
        onMouseMove={handleCardMouseMove}
        className="glass-panel glass-panel-hover p-4 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Gross Revenue</span>
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(totalRevenue)}</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Total order value</span>
        </div>
      </div>

      {/* Net Profit */}
      <div
        onMouseMove={handleCardMouseMove}
        className="glass-panel glass-panel-hover p-4 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Net Profit</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className={`text-2xl font-bold ${totalNetProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {formatCurrency(totalNetProfit)}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Post-costs & calibration</span>
        </div>
      </div>

      {/* Avg Profit Margin */}
      <div
        onMouseMove={handleCardMouseMove}
        className="glass-panel glass-panel-hover p-4 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avg Margin %</span>
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{avgMarginPercent.toFixed(1)}%</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Calibrated efficiency</span>
        </div>
      </div>
    </div>
  );
}
