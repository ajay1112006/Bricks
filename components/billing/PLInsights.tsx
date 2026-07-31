"use client";

import { TrendingUp, PieChart, ShieldAlert, Award } from "lucide-react";
import { handleCardMouseMove } from "@/lib/useSpotlight";

interface Order {
  orderId: string;
  customerName: string;
  revenue: number;
  costs: { materials: number; labor: number; overhead: number; shipping: number };
  marginAdjustment: number;
  netProfit: number;
  profitMarginPercent: number;
  status: string;
}

interface PLInsightsProps {
  orders: Order[];
}

export default function PLInsights({ orders }: PLInsightsProps) {
  if (orders.length === 0) return null;

  const totalRevenue = orders.reduce((sum, o) => sum + o.revenue, 0);
  const totalMaterials = orders.reduce((sum, o) => sum + (o.costs?.materials || 0), 0);
  const totalLabor = orders.reduce((sum, o) => sum + (o.costs?.labor || 0), 0);
  const totalOverhead = orders.reduce((sum, o) => sum + (o.costs?.overhead || 0), 0);
  const totalShipping = orders.reduce((sum, o) => sum + (o.costs?.shipping || 0), 0);
  const totalAdjustments = orders.reduce((sum, o) => sum + (o.marginAdjustment || 0), 0);

  const totalCosts = totalMaterials + totalLabor + totalOverhead + totalShipping;
  const netProfitTotal = totalRevenue - totalCosts + totalAdjustments;

  // Find top profitable order
  const topOrder = [...orders].sort((a, b) => b.profitMarginPercent - a.profitMarginPercent)[0];
  const lossCount = orders.filter((o) => o.netProfit < 0).length;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Expense Allocation Card */}
      <div
        onMouseMove={handleCardMouseMove}
        className="glass-panel glass-panel-hover p-5"
      >
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Aggregated Expense Allocation</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Distribution across active orders</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600 dark:text-slate-400">Materials ({totalCosts > 0 ? Math.round((totalMaterials / totalCosts) * 100) : 0}%)</span>
              <span className="font-mono text-slate-900 dark:text-slate-200 font-semibold">{formatCurrency(totalMaterials)}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${totalCosts > 0 ? (totalMaterials / totalCosts) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600 dark:text-slate-400">Labor ({totalCosts > 0 ? Math.round((totalLabor / totalCosts) * 100) : 0}%)</span>
              <span className="font-mono text-slate-900 dark:text-slate-200 font-semibold">{formatCurrency(totalLabor)}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${totalCosts > 0 ? (totalLabor / totalCosts) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Overhead & Shipping</span>
              <span className="font-mono text-slate-900 dark:text-slate-200 font-semibold">{formatCurrency(totalOverhead + totalShipping)}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${totalCosts > 0 ? ((totalOverhead + totalShipping) / totalCosts) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Profitability Benchmark */}
      <div
        onMouseMove={handleCardMouseMove}
        className="glass-panel glass-panel-hover p-5 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Top Margin Order Benchmark</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Highest performing order record</p>
            </div>
          </div>

          {topOrder ? (
            <div className="p-3.5 rounded-xl glass-card space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{topOrder.customerName}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                  {topOrder.profitMarginPercent}% Margin
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Order ID: {topOrder.orderId}</p>
              <div className="flex justify-between text-xs pt-1 border-t border-slate-200/80 dark:border-slate-800/80">
                <span className="text-slate-600 dark:text-slate-400">Revenue: {formatCurrency(topOrder.revenue)}</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">Profit: {formatCurrency(topOrder.netProfit)}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No order data</p>
          )}
        </div>

        <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
          * Calculated based on current costs and calibrated margin adjustments.
        </div>
      </div>

      {/* Calibration Health & Alerts */}
      <div
        onMouseMove={handleCardMouseMove}
        className="glass-panel glass-panel-hover p-5 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">P&L Portfolio Health</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Margin risk & calibration alerts</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-700 dark:text-slate-300">Total Margin Adjustments</span>
              <span className={`font-mono font-bold ${totalAdjustments >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
                {totalAdjustments >= 0 ? `+${formatCurrency(totalAdjustments)}` : formatCurrency(totalAdjustments)}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                Negative Profit Orders
              </span>
              <span className={`font-mono font-bold ${lossCount > 0 ? "text-rose-700 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                {lossCount} orders
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">Net Portfolio Profit:</span>
          <span className={`font-bold font-mono text-sm ${netProfitTotal >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
            {formatCurrency(netProfitTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
