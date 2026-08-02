"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  Receipt,
  Truck,
  Droplet,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Layers,
  ArrowUpRight,
  TrendingUp,
  X
} from "lucide-react";
import { handleCardMouseMove } from "@/lib/useSpotlight";
import PDFInvoiceModal, { InvoiceData } from "@/components/PDFInvoiceModal";
import { exportFinancialAnalyticsToExcel, TransactionExportItem } from "@/lib/excelExporter";

interface AggregatedTransaction {
  id: string;
  customerOrParty: string;
  type: "Customer Order" | "Truck Service" | "Material Cost";
  categoryOrService: string;
  date: string;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  paymentStatus: "Paid" | "Partial" | "Pending";
  notes?: string;
  rawItem?: any;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<AggregatedTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | "Customer Order" | "Truck Service" | "Material Cost">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Paid" | "Partial" | "Pending">("All");
  const [onlyCustomerDues, setOnlyCustomerDues] = useState(false);

  // GST Invoice Modal state
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);

  // Settle Payment Modal state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentItem, setPaymentItem] = useState<AggregatedTransaction | null>(null);
  const [paymentInput, setPaymentInput] = useState<number>(0);

  // Fetch all transactions from APIs
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ordersRes, trucksRes, matsRes] = await Promise.all([
        fetch("/api/orders").then((r) => r.json()),
        fetch("/api/trucks").then((r) => r.json()),
        fetch("/api/materials").then((r) => r.json()),
      ]);

      const combined: AggregatedTransaction[] = [];

      // 1. Customer Bricks Orders
      if (ordersRes.success && Array.isArray(ordersRes.data)) {
        ordersRes.data.forEach((o: any) => {
          const totalAmount = o.revenue || 0;
          const paid = o.status === "Delivered" ? totalAmount : totalAmount - 15000 > 0 ? totalAmount - 15000 : totalAmount;
          // Calculate due from status & margin
          const due = Math.max(0, totalAmount - paid);
          let pStatus: "Paid" | "Partial" | "Pending" = "Paid";
          if (due >= totalAmount && totalAmount > 0) pStatus = "Pending";
          else if (due > 0) pStatus = "Partial";

          combined.push({
            id: o.orderId,
            customerOrParty: o.customerName || "Customer",
            type: "Customer Order",
            categoryOrService: "Bricks Supply & Construction Order",
            date: o.date,
            totalAmount: totalAmount,
            amountPaid: paid,
            amountDue: due,
            paymentStatus: pStatus,
            notes: o.notes,
            rawItem: o,
          });
        });
      }

      // 2. Truck Transport Services
      if (trucksRes.success && Array.isArray(trucksRes.data)) {
        trucksRes.data.forEach((t: any) => {
          combined.push({
            id: t.truckId,
            customerOrParty: `${t.driverName} (${t.vehicleNumber})`,
            type: "Truck Service",
            categoryOrService: `Truck Freight (${t.quantity} × ₹${t.rate})`,
            date: t.date,
            totalAmount: t.totalPrice,
            amountPaid: t.amountPaid,
            amountDue: t.amountDue,
            paymentStatus: t.paymentStatus,
            notes: t.tripDetails || t.notes,
            rawItem: t,
          });
        });
      }

      // 3. Raw Material Costs
      if (matsRes.success && Array.isArray(matsRes.data)) {
        matsRes.data.forEach((m: any) => {
          combined.push({
            id: m.materialId,
            customerOrParty: m.supplier || m.name,
            type: "Material Cost",
            categoryOrService: `${m.category} Purchase (${m.name})`,
            date: m.date,
            totalAmount: m.totalCost,
            amountPaid: m.amountPaid,
            amountDue: m.amountDue,
            paymentStatus: m.paymentStatus,
            notes: m.notes,
            rawItem: m,
          });
        });
      }

      // Sort by date descending
      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(combined);
    } catch (err) {
      console.error("Error fetching transactions ledger:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filtered transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.customerOrParty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.categoryOrService.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "All" || t.type === typeFilter;
    const matchesStatus = statusFilter === "All" || t.paymentStatus === statusFilter;
    const matchesCustomerDuesOnly = !onlyCustomerDues || (t.type === "Customer Order" && t.amountDue > 0);

    return matchesSearch && matchesType && matchesStatus && matchesCustomerDuesOnly;
  });

  // Calculate Metrics
  const customerOrders = transactions.filter((t) => t.type === "Customer Order");
  const totalGrossRevenue = customerOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalCustomerPaid = customerOrders.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const totalCustomerPendingDue = customerOrders.reduce((acc, curr) => acc + curr.amountDue, 0);

  const vendorExpenses = transactions.filter((t) => t.type !== "Customer Order");
  const totalVendorCosts = vendorExpenses.reduce((acc, curr) => acc + curr.totalAmount, 0);

  // Generate GST Bill Modal
  const handleOpenGSTBill = (item: AggregatedTransaction) => {
    let itemsBreakdown = [];

    if (item.type === "Customer Order" && item.rawItem?.items) {
      itemsBreakdown = item.rawItem.items.map((i: any) => ({
        description: i.name,
        hsnCode: "6810", // HSN for Concrete / Masonry Bricks
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      }));
    } else if (item.type === "Truck Service") {
      itemsBreakdown = [
        {
          description: `Truck Freight Transport (${item.rawItem?.vehicleNumber || "Truck"}) - ${item.rawItem?.tripDetails || "Goods haulage"}`,
          hsnCode: "9965", // SAC for Road Freight Transport
          quantity: item.rawItem?.quantity || 1,
          unitPrice: item.rawItem?.rate || item.totalAmount,
        },
      ];
    } else {
      itemsBreakdown = [
        {
          description: `${item.categoryOrService}`,
          hsnCode: "2710", // HSN for Oils & Fuel Consumables
          quantity: 1,
          unitPrice: item.totalAmount,
        },
      ];
    }

    const invoiceData: InvoiceData = {
      invoiceNo: `INV-2026-${item.id.replace(/[^0-9]/g, "") || "101"}`,
      date: item.date,
      type: item.type,
      customerName: item.customerOrParty,
      customerEmail: item.rawItem?.customerEmail || "billing@elyontraders.com",
      items: itemsBreakdown,
      amountPaid: item.amountPaid,
      paymentStatus: item.paymentStatus,
      notes: item.notes,
    };

    setSelectedInvoice(invoiceData);
    setIsInvoiceOpen(true);
  };

  // Excel Analytics Export
  const handleExportExcel = () => {
    const exportItems: TransactionExportItem[] = filteredTransactions.map((t) => ({
      id: t.id,
      customerOrParty: t.customerOrParty,
      type: t.type,
      categoryOrService: t.categoryOrService,
      date: t.date,
      totalAmount: t.totalAmount,
      amountPaid: t.amountPaid,
      amountDue: t.amountDue,
      paymentStatus: t.paymentStatus,
      notes: t.notes,
    }));

    exportFinancialAnalyticsToExcel(exportItems);
  };

  // Open Settle Payment
  const handleOpenPayment = (item: AggregatedTransaction) => {
    setPaymentItem(item);
    setPaymentInput(item.amountDue);
    setIsPaymentOpen(true);
  };

  // Submit Settle Payment
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentItem) return;

    try {
      const newPaid = Number(paymentItem.amountPaid) + Number(paymentInput);
      let endpoint = "";
      if (paymentItem.type === "Truck Service") {
        endpoint = `/api/trucks/${paymentItem.id}`;
      } else if (paymentItem.type === "Material Cost") {
        endpoint = `/api/materials/${paymentItem.id}`;
      } else {
        endpoint = `/api/orders/${paymentItem.id}/calibrate`;
      }

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          paymentItem.type === "Customer Order"
            ? { marginAdjustment: Number(paymentInput) }
            : { amountPaid: newPaid }
        ),
      });

      const data = await res.json();
      if (data.success) {
        setIsPaymentOpen(false);
        setPaymentItem(null);
        fetchAllData();
      } else {
        alert(data.error || "Failed to update payment");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 py-4 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-amber-900/20 via-amber-600/10 to-transparent p-6 rounded-3xl border border-amber-500/30 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <Receipt className="w-3.5 h-3.5" />
            <span>Financial Intelligence & GST Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-amber-100">
            Financial Ledger & Transactions
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Track customer payments, money pending to be paid by customers, GST tax invoices, and complete Excel analytics export.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={handleExportExcel}
            className="flex-1 md:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-600/20 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Analytics to Excel</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gross Revenue */}
        <div
          onMouseMove={handleCardMouseMove}
          className="glass-panel p-5 rounded-2xl border-amber-500/20 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Total Gross Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-bold text-slate-900 dark:text-amber-100">
              ₹{totalGrossRevenue.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
              From Customer Orders
            </span>
          </div>
        </div>

        {/* Total Paid by Customers */}
        <div
          onMouseMove={handleCardMouseMove}
          className="glass-panel p-5 rounded-2xl border-amber-500/20 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Total Money Received</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400">
              ₹{totalCustomerPaid.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
              Collected Customer Payments
            </span>
          </div>
        </div>

        {/* Total Money Need to Pay by Customer */}
        <div
          onMouseMove={handleCardMouseMove}
          className="glass-panel p-5 rounded-2xl border-amber-500/30 bg-gradient-to-tr from-amber-500/10 via-transparent to-transparent flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Money Need to Pay (Customer Dues)</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-bold text-amber-600 dark:text-amber-400">
              ₹{totalCustomerPendingDue.toLocaleString()}
            </span>
            <span className="text-[11px] text-amber-700/80 dark:text-amber-300/80 font-medium block mt-1">
              Outstanding Customer Balance
            </span>
          </div>
        </div>

        {/* Total Vendor Expenses */}
        <div
          onMouseMove={handleCardMouseMove}
          className="glass-panel p-5 rounded-2xl border-amber-500/20 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Operational Expenses</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-bold text-slate-900 dark:text-amber-100">
              ₹{totalVendorCosts.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
              Truck Freight + Raw Materials
            </span>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="glass-panel p-5 rounded-3xl border-amber-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-serif font-bold text-slate-900 dark:text-amber-100">
              Transaction Ledger Filters
            </h3>
          </div>

          <button
            onClick={() => setOnlyCustomerDues(!onlyCustomerDues)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
              onlyCustomerDues
                ? "bg-amber-600 text-white border-amber-600 font-bold"
                : "bg-white/60 dark:bg-black/40 text-slate-600 dark:text-slate-300 border-amber-500/20 hover:border-amber-500/40"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Show Only Customer Pending Dues</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Customer name, Invoice ID, Service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/80 dark:bg-black/60 border border-amber-500/20 text-xs sm:text-sm focus:outline-none focus:border-amber-500 text-slate-900 dark:text-amber-100"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-white/80 dark:bg-black/60 border border-amber-500/20 text-xs sm:text-sm font-medium focus:outline-none focus:border-amber-500 text-slate-900 dark:text-amber-200"
          >
            <option value="All">All Transaction Types</option>
            <option value="Customer Order">Customer Bricks Orders</option>
            <option value="Truck Service">Truck Freight Services</option>
            <option value="Material Cost">Raw Material Expenses</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-white/80 dark:bg-black/60 border border-amber-500/20 text-xs sm:text-sm font-medium focus:outline-none focus:border-amber-500 text-slate-900 dark:text-amber-200"
          >
            <option value="All">All Payment Statuses</option>
            <option value="Paid">Fully Paid</option>
            <option value="Partial">Partial (Money Pending)</option>
            <option value="Pending">Pending / Unpaid</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border-amber-500/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-amber-500/10 text-amber-900 dark:text-amber-200 font-serif font-semibold border-b border-amber-500/20">
              <tr>
                <th className="p-4">Customer / Party Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">Service & Details</th>
                <th className="p-4">Date</th>
                <th className="p-4">Total Bill (₹)</th>
                <th className="p-4">Amount Paid (₹)</th>
                <th className="p-4">Money Need to Pay (₹)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 font-serif">
                    Loading money transactions ledger...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No money transactions match your selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-500/5 transition-colors">
                    <td className="p-4 font-semibold text-slate-900 dark:text-amber-100">
                      <div>
                        <span className="block font-bold">{item.customerOrParty}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono font-normal">
                          ID: {item.id}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          item.type === "Customer Order"
                            ? "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30"
                            : item.type === "Truck Service"
                            ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30"
                            : "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>

                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      {item.categoryOrService}
                    </td>

                    <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {item.date}
                    </td>

                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-amber-100">
                      ₹{item.totalAmount.toLocaleString()}
                    </td>

                    <td className="p-4 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      ₹{item.amountPaid.toLocaleString()}
                    </td>

                    <td className="p-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                      ₹{item.amountDue.toLocaleString()}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          item.paymentStatus === "Paid"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : item.paymentStatus === "Partial"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {item.paymentStatus === "Paid" ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        <span>{item.paymentStatus}</span>
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Generate GST PDF Invoice Button */}
                        <button
                          onClick={() => handleOpenGSTBill(item)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-medium hover:bg-amber-500/20 transition-all flex items-center space-x-1"
                          title="Generate GST Bill PDF"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>GST Bill</span>
                        </button>

                        {/* Settle Payment Button */}
                        {item.amountDue > 0 && (
                          <button
                            onClick={() => handleOpenPayment(item)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-500/20 transition-all flex items-center space-x-1"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Settle</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* GST Invoice Modal */}
      <PDFInvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        invoice={selectedInvoice}
      />

      {/* Record Payment Modal */}
      {isPaymentOpen && paymentItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border-amber-500/30 relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsPaymentOpen(false)}
              className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 mb-5">
              <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100">
                Record Customer Payment
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Settle customer balance for: <span className="font-semibold text-amber-700 dark:text-amber-300">{paymentItem.customerOrParty}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5 text-xs font-mono mb-5">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Transaction Bill:</span>
                <span className="font-bold">₹{paymentItem.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Previously Paid:</span>
                <span className="text-emerald-600 dark:text-emerald-400">₹{paymentItem.amountPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-amber-500/20 pt-1.5">
                <span className="text-slate-700 dark:text-slate-300 font-bold">Money Need to Pay:</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold text-sm">
                  ₹{paymentItem.amountDue.toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Payment Amount Received (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={paymentItem.amountDue}
                  required
                  value={paymentInput}
                  onChange={(e) => setPaymentInput(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-black/50 border border-amber-500/20 text-sm font-mono font-bold focus:outline-none focus:border-amber-500 text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-3 border-t border-amber-900/10 dark:border-amber-500/20">
                <button
                  type="button"
                  onClick={() => setIsPaymentOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
