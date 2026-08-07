"use client";

import { useState, useEffect } from "react";
import {
  Droplet,
  Trees,
  Fuel,
  Truck,
  Plus,
  Search,
  DollarSign,
  Calculator,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  X,
  CreditCard,
  Layers,
  ArrowUpRight,
  Sparkles
} from "lucide-react";
import { handleCardMouseMove } from "@/lib/useSpotlight";

interface MaterialItem {
  materialId: string;
  name: string;
  category: string;
  date: string;
  totalCost: number;
  amountPaid: number;
  amountDue: number;
  paymentStatus: "Paid" | "Partial" | "Pending";
  supplier?: string;
  notes?: string;
}

interface TruckServiceItem {
  truckId: string;
  vehicleNumber: string;
  driverName: string;
  date: string;
  quantity: number;
  rate: number;
  totalPrice: number;
  amountPaid: number;
  amountDue: number;
  paymentStatus: "Paid" | "Partial" | "Pending";
  tripDetails?: string;
  notes?: string;
}

export default function MaterialsPage() {
  const [activeTab, setActiveTab] = useState<"materials" | "trucks">("materials");
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [trucks, setTrucks] = useState<TruckServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Paid" | "Partial" | "Pending">("All");

  // Modals state
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [isAddTruckOpen, setIsAddTruckOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentItem, setSelectedPaymentItem] = useState<{
    type: "material" | "truck";
    id: string;
    name: string;
    total: number;
    paid: number;
    due: number;
  } | null>(null);

  // Material Form state
  const todayStr = new Date().toLocaleDateString("sv");
  const [matForm, setMatForm] = useState({
    name: "Industrial Machinery Oil",
    category: "Oil",
    date: todayStr,
    totalCost: 15000,
    amountPaid: 5000,
    supplier: "Castrol Suppliers Ltd",
    notes: "",
  });

  // Truck Form state
  const [truckForm, setTruckForm] = useState({
    vehicleNumber: "TN-38-AX-2094",
    driverName: "Ramesh Kumar",
    date: todayStr,
    quantity: 2.6,
    rate: 3000,
    manualTotal: 7800,
    amountPaid: 5000,
    tripDetails: "2.6 trips of clay transport",
    notes: "Calculated: 2.6 x 3000",
  });

  // Interactive Live Truck Calculator Widget state
  const [calcQty, setCalcQty] = useState<number>(2.6);
  const [calcRate, setCalcRate] = useState<number>(3000);

  // Payment Modal input state
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(0);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [matRes, trkRes] = await Promise.all([
        fetch("/api/materials").then((r) => r.json()),
        fetch("/api/trucks").then((r) => r.json()),
      ]);

      if (matRes.success) setMaterials(matRes.data);
      if (trkRes.success) setTrucks(trkRes.data);
    } catch (err) {
      console.error("Error fetching materials & truck services:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update truckForm total when quantity or rate changes
  useEffect(() => {
    const computed = Number((truckForm.quantity * truckForm.rate).toFixed(2));
    setTruckForm((prev) => ({ ...prev, manualTotal: computed }));
  }, [truckForm.quantity, truckForm.rate]);

  // Quick preset click handler for Material Modal
  const handleSelectPreset = (presetName: string, category: string) => {
    setMatForm((prev) => ({
      ...prev,
      name: presetName,
      category: category,
    }));
  };

  // Add Material submit
  const handleAddMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: matForm.name,
          category: matForm.category,
          date: matForm.date,
          totalCost: Number(matForm.totalCost),
          amountPaid: Number(matForm.amountPaid),
          supplier: matForm.supplier,
          notes: matForm.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddMaterialOpen(false);
        fetchData();
      } else {
        alert(data.error || "Failed to add material entry");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Truck Entry submit
  const handleAddTruckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/trucks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleNumber: truckForm.vehicleNumber,
          driverName: truckForm.driverName,
          date: truckForm.date,
          quantity: Number(truckForm.quantity),
          rate: Number(truckForm.rate),
          totalPrice: Number(truckForm.manualTotal),
          amountPaid: Number(truckForm.amountPaid),
          tripDetails: truckForm.tripDetails,
          notes: truckForm.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddTruckOpen(false);
        fetchData();
      } else {
        alert(data.error || "Failed to add truck entry");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete item
  const handleDeleteItem = async (type: "material" | "truck", id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const endpoint = type === "material" ? `/api/materials/${id}` : `/api/trucks/${id}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "Failed to delete item");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Payment Settle Modal
  const handleOpenPaymentModal = (
    type: "material" | "truck",
    id: string,
    name: string,
    total: number,
    paid: number,
    due: number
  ) => {
    setSelectedPaymentItem({ type, id, name, total, paid, due });
    setPaymentAmountInput(due); // default to full remaining balance
    setIsPaymentModalOpen(true);
  };

  // Submit Payment update
  const handleSavePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentItem) return;
    try {
      const newPaid = Number(selectedPaymentItem.paid) + Number(paymentAmountInput);
      const endpoint =
        selectedPaymentItem.type === "material"
          ? `/api/materials/${selectedPaymentItem.id}`
          : `/api/trucks/${selectedPaymentItem.id}`;

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountPaid: newPaid }),
      });
      const data = await res.json();
      if (data.success) {
        setIsPaymentModalOpen(false);
        setSelectedPaymentItem(null);
        fetchData();
      } else {
        alert(data.error || "Failed to update payment");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fill truck modal from live calculator widget
  const handleUseCalcInTruckModal = () => {
    setTruckForm((prev) => ({
      ...prev,
      quantity: calcQty,
      rate: calcRate,
      manualTotal: Number((calcQty * calcRate).toFixed(2)),
      notes: `Calculated: ${calcQty} x ${calcRate}`,
    }));
    setIsAddTruckOpen(true);
  };

  // Calculations for Summary Cards
  const totalMatSpend = materials.reduce((acc, curr) => acc + curr.totalCost, 0);
  const totalMatPaid = materials.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const totalMatDue = materials.reduce((acc, curr) => acc + curr.amountDue, 0);

  const totalTruckSpend = trucks.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalTruckPaid = trucks.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const totalTruckDue = trucks.reduce((acc, curr) => acc + curr.amountDue, 0);

  // Filtered lists
  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.supplier && m.supplier.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "All" || m.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTrucks = trucks.filter((t) => {
    const matchesSearch =
      t.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.tripDetails && t.tripDetails.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "All" || t.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 py-4 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-amber-900/20 via-amber-600/10 to-transparent p-6 rounded-3xl border border-amber-500/30 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>ERP Enterprise Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-amber-100">
            Materials & Trucking Logistics
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Manage raw material purchases (Oil, Wood, Diesel), cost balances, and custom formula truck freight services.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={() => setIsAddMaterialOpen(true)}
            className="flex-1 md:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-amber-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Material</span>
          </button>
          <button
            onClick={() => setIsAddTruckOpen(true)}
            className="flex-1 md:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500/20 hover:bg-slate-800 text-white dark:text-amber-200 border border-amber-500/30 text-xs sm:text-sm font-semibold transition-all"
          >
            <Truck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Add Truck Service</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Materials Spend */}
        <div
          onMouseMove={handleCardMouseMove}
          className="glass-panel p-5 rounded-2xl border-amber-500/20 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Total Materials Expense</span>
            <Droplet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-bold text-slate-900 dark:text-amber-100">
              ₹{totalMatSpend.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
              Oil, Wood, Diesel & Raw Consumables
            </span>
          </div>
        </div>

        {/* Materials Due Balance */}
        <div
          onMouseMove={handleCardMouseMove}
          className="glass-panel p-5 rounded-2xl border-amber-500/20 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Materials Remaining Due</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-bold text-amber-600 dark:text-amber-400">
              ₹{totalMatDue.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
              Paid: ₹{totalMatPaid.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Total Truck Freight Expense */}
        <div
          onMouseMove={handleCardMouseMove}
          className="glass-panel p-5 rounded-2xl border-amber-500/20 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Total Truck Services</span>
            <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-bold text-slate-900 dark:text-amber-100">
              ₹{totalTruckSpend.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
              Transport & Freight Services
            </span>
          </div>
        </div>

        {/* Truck Services Due */}
        <div
          onMouseMove={handleCardMouseMove}
          className="glass-panel p-5 rounded-2xl border-amber-500/20 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Trucking Freight Due</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif font-bold text-amber-600 dark:text-amber-400">
              ₹{totalTruckDue.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
              Paid: ₹{totalTruckPaid.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Quick Truck Price Calculator Widget */}
      <div
        onMouseMove={handleCardMouseMove}
        className="glass-panel p-5 sm:p-6 rounded-3xl border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-transparent relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold">
              <Calculator className="w-3.5 h-3.5" />
              <span>Manual Formula Calculator</span>
            </div>
            <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-amber-100">
              Truck Freight Price Calculator
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Calculate truck cost dynamically based on custom multipliers (e.g. <span className="font-mono font-bold text-amber-600 dark:text-amber-300">2.6 trips × ₹3,000 = ₹7,800</span>).
            </p>
          </div>

          {/* Calculator Inputs */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto bg-white/40 dark:bg-black/40 p-3.5 rounded-2xl border border-amber-500/20">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Qty / Trips:</label>
              <input
                type="number"
                step="any"
                min="0"
                value={calcQty}
                onChange={(e) => setCalcQty(Number(e.target.value))}
                className="w-20 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/30 text-sm font-mono font-bold text-slate-900 dark:text-amber-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">×</span>

            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Unit Rate (₹):</label>
              <input
                type="number"
                step="any"
                min="0"
                value={calcRate}
                onChange={(e) => setCalcRate(Number(e.target.value))}
                className="w-24 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/30 text-sm font-mono font-bold text-slate-900 dark:text-amber-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">=</span>

            <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-sm font-mono font-bold text-amber-900 dark:text-amber-100">
              ₹{(calcQty * calcRate).toLocaleString()}
            </div>

            <button
              onClick={handleUseCalcInTruckModal}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow transition-all flex items-center space-x-1"
            >
              <span>Log Entry</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-amber-900/10 dark:border-amber-500/20 pb-4">
        {/* Main Tab Switches */}
        <div className="flex items-center space-x-2 bg-white/60 dark:bg-black/40 p-1.5 rounded-2xl border border-amber-500/20">
          <button
            onClick={() => setActiveTab("materials")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "materials"
                ? "bg-amber-600 text-white shadow-md font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200"
            }`}
          >
            <Droplet className="w-4 h-4" />
            <span>Materials Inventory ({materials.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("trucks")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "trucks"
                ? "bg-amber-600 text-white shadow-md font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-200"
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Trucking Services ({trucks.length})</span>
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:flex-initial min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === "materials" ? "Search Oil, Wood, Diesel..." : "Search truck number, driver..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/80 dark:bg-black/60 border border-amber-500/20 text-xs sm:text-sm focus:outline-none focus:border-amber-500 text-slate-900 dark:text-amber-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-white/80 dark:bg-black/60 border border-amber-500/20 text-xs sm:text-sm font-medium focus:outline-none focus:border-amber-500 text-slate-900 dark:text-amber-200"
          >
            <option value="All">All Payment Statuses</option>
            <option value="Paid">Fully Paid</option>
            <option value="Partial">Partially Paid</option>
            <option value="Pending">Pending Payment</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400 font-serif">
          Loading Materials & Freight Log records...
        </div>
      ) : activeTab === "materials" ? (
        /* Materials Table & List View */
        <div className="glass-panel rounded-3xl overflow-hidden border-amber-500/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-amber-500/10 text-amber-900 dark:text-amber-200 font-serif font-semibold border-b border-amber-500/20">
                <tr>
                  <th className="p-4">Material / Item</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Total Cost</th>
                  <th className="p-4">Amount Paid</th>
                  <th className="p-4">Amount Due</th>
                  <th className="p-4">Payment Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/60 font-sans">
                {filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No material records found. Click <strong>Add Material</strong> to create your first entry.
                    </td>
                  </tr>
                ) : (
                  filteredMaterials.map((item) => (
                    <tr key={item.materialId} className="hover:bg-amber-500/5 transition-colors">
                      <td className="p-4 font-semibold text-slate-900 dark:text-amber-100">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            {item.category.toLowerCase().includes("oil") ? (
                              <Droplet className="w-4 h-4" />
                            ) : item.category.toLowerCase().includes("wood") ? (
                              <Trees className="w-4 h-4" />
                            ) : item.category.toLowerCase().includes("diesel") || item.category.toLowerCase().includes("fuel") ? (
                              <Fuel className="w-4 h-4" />
                            ) : (
                              <Layers className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span className="block font-bold">{item.name}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-normal">
                              ID: {item.materialId} • Supplier: {item.supplier || "N/A"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 dark:bg-neutral-900 border border-amber-500/20 text-slate-700 dark:text-slate-300 text-xs font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {item.date}
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-amber-100">
                        ₹{item.totalCost.toLocaleString()}
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
                          {item.amountDue > 0 && (
                            <button
                              onClick={() =>
                                handleOpenPaymentModal(
                                  "material",
                                  item.materialId,
                                  item.name,
                                  item.totalCost,
                                  item.amountPaid,
                                  item.amountDue
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-500/20 transition-all flex items-center space-x-1"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Settle</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteItem("material", item.materialId)}
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
      ) : (
        /* Trucking Services Table & List View */
        <div className="glass-panel rounded-3xl overflow-hidden border-amber-500/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-amber-500/10 text-amber-900 dark:text-amber-200 font-serif font-semibold border-b border-amber-500/20">
                <tr>
                  <th className="p-4">Truck / Vehicle</th>
                  <th className="p-4">Driver / Vendor</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Formula (Qty × Rate)</th>
                  <th className="p-4">Total Price</th>
                  <th className="p-4">Paid</th>
                  <th className="p-4">Balance Due</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/60 font-sans">
                {filteredTrucks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No truck service logs found. Click <strong>Add Truck Service</strong> to log a truck transport.
                    </td>
                  </tr>
                ) : (
                  filteredTrucks.map((item) => (
                    <tr key={item.truckId} className="hover:bg-amber-500/5 transition-colors">
                      <td className="p-4 font-semibold text-slate-900 dark:text-amber-100">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block font-mono font-bold">{item.vehicleNumber}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-normal">
                              ID: {item.truckId}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                        {item.driverName}
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {item.date}
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          {item.quantity} × ₹{item.rate.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-amber-100">
                        ₹{item.totalPrice.toLocaleString()}
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
                          {item.amountDue > 0 && (
                            <button
                              onClick={() =>
                                handleOpenPaymentModal(
                                  "truck",
                                  item.truckId,
                                  `Truck ${item.vehicleNumber}`,
                                  item.totalPrice,
                                  item.amountPaid,
                                  item.amountDue
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-500/20 transition-all flex items-center space-x-1"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Settle</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteItem("truck", item.truckId)}
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
      )}

      {/* --- ADD MATERIAL MODAL --- */}
      {isAddMaterialOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-6 sm:p-8 rounded-3xl border-amber-500/30 relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsAddMaterialOpen(false)}
              className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 mb-6">
              <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100">
                Add Material Purchase
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log oil, wood, diesel or other material costs and payments.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">
                Quick Category Presets:
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectPreset("Industrial Heavy Machinery Oil", "Oil")}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 flex items-center space-x-1.5"
                >
                  <Droplet className="w-3.5 h-3.5 text-amber-500" />
                  <span>Oil</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("Hardwood Timber & Stacking Wood", "Wood")}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 flex items-center space-x-1.5"
                >
                  <Trees className="w-3.5 h-3.5 text-amber-500" />
                  <span>Wood</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset("High-Grade Diesel Fuel", "Diesel")}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 flex items-center space-x-1.5"
                >
                  <Fuel className="w-3.5 h-3.5 text-amber-500" />
                  <span>Diesel</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleAddMaterialSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Item / Material Name *
                </label>
                <input
                  type="text"
                  required
                  value={matForm.name}
                  onChange={(e) => setMatForm({ ...matForm, name: e.target.value })}
                  placeholder="e.g. Castrol Hydraulic Machinery Oil"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-black/50 border border-amber-500/20 text-sm focus:outline-none focus:border-amber-500 text-slate-900 dark:text-amber-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={matForm.category}
                    onChange={(e) => setMatForm({ ...matForm, category: e.target.value })}
                    placeholder="Oil, Wood, Diesel..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-black/50 border border-amber-500/20 text-sm focus:outline-none focus:border-amber-500 text-slate-900 dark:text-amber-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={matForm.date}
                    onChange={(e) => setMatForm({ ...matForm, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-black/50 border border-amber-500/20 text-sm focus:outline-none focus:border-amber-500 text-slate-900 dark:text-amber-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Total Cost (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={matForm.totalCost}
                    onChange={(e) => setMatForm({ ...matForm, totalCost: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-black/50 border border-amber-500/20 text-sm font-mono font-bold focus:outline-none focus:border-amber-500 text-slate-900 dark:text-amber-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Amount Paid (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={matForm.amountPaid}
                    onChange={(e) => setMatForm({ ...matForm, amountPaid: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-black/50 border border-amber-500/20 text-sm font-mono font-bold focus:outline-none focus:border-amber-500 text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              {/* Calculated Due Preview */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-600 dark:text-slate-400">Calculated Balance Due:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  ₹{Math.max(0, matForm.totalCost - matForm.amountPaid).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Supplier / Vendor Name
                </label>
                <input
                  type="text"
                  value={matForm.supplier}
                  onChange={(e) => setMatForm({ ...matForm, supplier: e.target.value })}
                  placeholder="e.g. Apex Fuels & Oils Ltd"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-black/50 border border-amber-500/20 text-sm focus:outline-none focus:border-amber-500 text-slate-900 dark:text-amber-100"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-3 border-t border-amber-900/10 dark:border-amber-500/20">
                <button
                  type="button"
                  onClick={() => setIsAddMaterialOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-600/20"
                >
                  Save Material Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD TRUCK SERVICE MODAL --- */}
      {isAddTruckOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-6 sm:p-8 rounded-3xl border-amber-500/30 relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsAddTruckOpen(false)}
              className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 mb-6">
              <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100">
                Log Truck Service & Freight
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calculate total price using manual multipliers (e.g. <span className="font-mono text-amber-600 dark:text-amber-300">2.6 trips × ₹3,000</span>).
              </p>
            </div>

            <form onSubmit={handleAddTruckSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Truck / Vehicle No *
                  </label>
                  <input
                    type="text"
                    required
                    value={truckForm.vehicleNumber}
                    onChange={(e) => setTruckForm({ ...truckForm, vehicleNumber: e.target.value })}
                    placeholder="e.g. TN-38-AX-2094"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-black/50 border border-amber-500/20 text-sm font-mono font-bold focus:outline-none focus:border-amber-500 text-slate-900 dark:text-amber-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Driver / Vendor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={truckForm.driverName}
                    onChange={(e) => setTruckForm({ ...truckForm, driverName: e.target.value })}
                    placeholder="e.g. Ramesh Transport"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-black/50 border border-amber-500/20 text-sm focus:outline-none focus:border-amber-500 text-slate-900 dark:text-amber-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Service Date *
                </label>
                <input
                  type="date"
                  required
                  value={truckForm.date}
                  onChange={(e) => setTruckForm({ ...truckForm, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-black/50 border border-amber-500/20 text-sm focus:outline-none focus:border-amber-500 text-slate-900 dark:text-amber-100"
                />
              </div>

              {/* Dynamic Rate x Quantity Calculation */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                <span className="text-xs font-serif font-bold text-amber-800 dark:text-amber-300 block">
                  Interactive Formula Pricing:
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Quantity / Multiplier (e.g. 2.6)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={truckForm.quantity}
                      onChange={(e) => setTruckForm({ ...truckForm, quantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/60 border border-amber-500/30 text-sm font-mono font-bold focus:outline-none focus:border-amber-500 text-slate-900 dark:text-amber-100"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Rate per Unit (₹) (e.g. 3000)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={truckForm.rate}
                      onChange={(e) => setTruckForm({ ...truckForm, rate: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/60 border border-amber-500/30 text-sm font-mono font-bold focus:outline-none focus:border-amber-500 text-slate-900 dark:text-amber-100"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 font-mono text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Total Truck Price (Qty × Rate):</span>
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-200">
                    ₹{truckForm.manualTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Amount Paid Now (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={truckForm.amountPaid}
                  onChange={(e) => setTruckForm({ ...truckForm, amountPaid: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-black/50 border border-amber-500/20 text-sm font-mono font-bold focus:outline-none focus:border-amber-500 text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Trip / Freight Description
                </label>
                <input
                  type="text"
                  value={truckForm.tripDetails}
                  onChange={(e) => setTruckForm({ ...truckForm, tripDetails: e.target.value })}
                  placeholder="e.g. Clay transport to kiln site"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-black/50 border border-amber-500/20 text-sm focus:outline-none focus:border-amber-500 text-slate-900 dark:text-amber-100"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-3 border-t border-amber-900/10 dark:border-amber-500/20">
                <button
                  type="button"
                  onClick={() => setIsAddTruckOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-600/20"
                >
                  Save Truck Service Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PAYMENT SETTLE MODAL --- */}
      {isPaymentModalOpen && selectedPaymentItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border-amber-500/30 relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 mb-5">
              <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-amber-100">
                Record Payment
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Updating balance for: <span className="font-semibold text-amber-700 dark:text-amber-300">{selectedPaymentItem.name}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5 text-xs font-mono mb-5">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Bill:</span>
                <span className="font-bold">₹{selectedPaymentItem.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Previously Paid:</span>
                <span className="text-emerald-600 dark:text-emerald-400">₹{selectedPaymentItem.paid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-amber-500/20 pt-1.5">
                <span className="text-slate-700 dark:text-slate-300 font-bold">Remaining Due:</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold text-sm">
                  ₹{selectedPaymentItem.due.toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleSavePaymentSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Additional Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedPaymentItem.due}
                  required
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-black/50 border border-amber-500/20 text-sm font-mono font-bold focus:outline-none focus:border-amber-500 text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-3 border-t border-amber-900/10 dark:border-amber-500/20">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
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
