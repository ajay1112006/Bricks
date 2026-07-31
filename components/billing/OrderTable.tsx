"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Plus,
  Sliders,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  RotateCcw,
  FileSpreadsheet,
  ChevronRight,
  IndianRupee
} from "lucide-react";
import OrderMetrics from "./OrderMetrics";
import CalibrationModal from "./CalibrationModal";
import OrderModal from "./OrderModal";
import PLInsights from "./PLInsights";

interface Order {
  orderId: string;
  customerName: string;
  customerEmail?: string;
  items: { name: string; quantity: number; unitPrice: number; costPrice: number }[];
  status: "Draft" | "In Progress" | "Delivered" | "Cancelled";
  revenue: number;
  costs: { materials: number; labor: number; overhead: number; shipping: number };
  marginAdjustment: number;
  netProfit: number;
  profitMarginPercent: number;
  notes?: string;
  date: string;
  createdAt: string;
}

export default function OrderTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState<boolean>(false);
  const [selectedOrderForCalibration, setSelectedOrderForCalibration] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = statusFilter !== "All" ? `/api/orders?status=${encodeURIComponent(statusFilter)}` : "/api/orders";
      const res = await fetch(url);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch orders");
      }
      setOrders(data.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      fetchOrders();
    } catch (e: any) {
      alert("Failed to update status: " + e.message);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm(`Are you sure you want to delete order ${orderId}?`)) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      fetchOrders();
    } catch (e: any) {
      alert("Failed to delete order: " + e.message);
    }
  };

  const handleOpenCalibration = (order: Order) => {
    setSelectedOrderForCalibration(order);
    setIsCalibrationOpen(true);
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.orderId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Aggregated metrics calculation
  const totalOrders = orders.length;
  const inProgressCount = orders.filter((o) => o.status === "In Progress").length;
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.revenue, 0);
  const totalNetProfit = orders.reduce((sum, o) => sum + o.netProfit, 0);
  const avgMarginPercent = totalOrders > 0 ? orders.reduce((sum, o) => sum + o.profitMarginPercent, 0) / totalOrders : 0;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="glass-panel p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Billing & Order Profit Monitor</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
              P&L Calibrated
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Order lifecycle management, itemized cost tracking, and dynamic P&L calibration.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            title="Refresh Orders"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Order</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Header Component */}
      <OrderMetrics
        totalOrders={totalOrders}
        inProgressCount={inProgressCount}
        deliveredCount={deliveredCount}
        totalRevenue={totalRevenue}
        totalNetProfit={totalNetProfit}
        avgMarginPercent={avgMarginPercent}
      />

      {/* P&L Aggregated Insights */}
      <PLInsights orders={orders} />

      {/* Table Filter Bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search order ID or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {["All", "In Progress", "Delivered", "Draft", "Cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === status
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Data Table */}
      <div className="glass-panel overflow-hidden border-slate-200 dark:border-slate-800/80">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/60">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200">
            Order Inventory & Financial Records ({filteredOrders.length})
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Click &quot;Calibrate P&L&quot; to adjust cost breakdowns & margin rebates
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading order records...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
            No orders found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Order ID & Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Revenue</th>
                  <th className="py-3.5 px-4">Total Costs</th>
                  <th className="py-3.5 px-4">Margin Adj.</th>
                  <th className="py-3.5 px-4">Net Profit</th>
                  <th className="py-3.5 px-4">Margin %</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-900 dark:text-slate-200 font-medium">
                {filteredOrders.map((order) => {
                  const totalCosts = (order.costs?.materials || 0) + (order.costs?.labor || 0) + (order.costs?.overhead || 0) + (order.costs?.shipping || 0);
                  const isProfitable = order.netProfit >= 0;

                  return (
                    <tr key={order.orderId} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 font-mono">{order.orderId}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{order.date}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{order.customerName}</div>
                        {order.customerEmail && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{order.customerEmail}</div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                          className={`text-xs font-bold rounded-lg px-2.5 py-1 border cursor-pointer focus:outline-none transition ${
                            order.status === "Delivered"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                              : order.status === "In Progress"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                              : order.status === "Draft"
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                              : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                          }`}
                        >
                          <option value="In Progress" className="bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400">In Progress</option>
                          <option value="Delivered" className="bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400">Delivered</option>
                          <option value="Draft" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">Draft</option>
                          <option value="Cancelled" className="bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400">Cancelled</option>
                        </select>
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(order.revenue)}
                      </td>

                      <td className="py-4 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {formatCurrency(totalCosts)}
                      </td>

                      <td className="py-4 px-4 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] ${
                            order.marginAdjustment > 0
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold"
                              : order.marginAdjustment < 0
                              ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold"
                              : "text-slate-500"
                          }`}
                        >
                          {order.marginAdjustment >= 0 ? `+${formatCurrency(order.marginAdjustment)}` : formatCurrency(order.marginAdjustment)}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-mono font-bold">
                        <span className={isProfitable ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}>
                          {formatCurrency(order.netProfit)}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] ${
                            order.profitMarginPercent > 15
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : order.profitMarginPercent > 0
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                              : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                          }`}
                        >
                          {order.profitMarginPercent}%
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenCalibration(order)}
                          className="px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-600/20 hover:bg-purple-100 dark:hover:bg-purple-600/30 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-500/30 transition text-xs inline-flex items-center gap-1"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Calibrate P&L</span>
                        </button>

                        <button
                          onClick={() => handleDeleteOrder(order.orderId)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition inline-flex"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modals */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onOrderSaved={fetchOrders}
      />

      <CalibrationModal
        isOpen={isCalibrationOpen}
        order={selectedOrderForCalibration}
        onClose={() => setIsCalibrationOpen(false)}
        onCalibrated={fetchOrders}
      />
    </div>
  );
}
