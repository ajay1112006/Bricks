// In-Memory Data Store Fallback for instant preview & testing when MongoDB URI is absent or during initial seed.

export interface MockEmployee {
  employeeId: string;
  name: string;
  role: string;
  department: string;
  status: "Active" | "Inactive";
  dailySalary?: number;
  advanceAmount?: number;
  createdAt: string;
}

export interface MockAttendanceRecord {
  employeeId: string;
  employeeName: string;
  status: "Present" | "Absent";
  timestamp: string;
  notes?: string;
}

export interface MockAttendance {
  date: string;
  session: number;
  records: MockAttendanceRecord[];
  updatedAt: string;
}

export interface MockOrder {
  orderId: string;
  customerName: string;
  customerPhone?: string;
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

let mockEmployees: MockEmployee[] = [
  { employeeId: "EMP-001", name: "Alex Mercer", role: "Senior Mason", department: "Construction", status: "Active", dailySalary: 850, advanceAmount: 2000, createdAt: new Date().toISOString() },
  { employeeId: "EMP-002", name: "Sarah Connor", role: "Project Manager", department: "Operations", status: "Active", dailySalary: 1200, advanceAmount: 0, createdAt: new Date().toISOString() },
  { employeeId: "EMP-003", name: "David Miller", role: "Site Supervisor", department: "Field Ops", status: "Active", dailySalary: 950, advanceAmount: 1500, createdAt: new Date().toISOString() },
  { employeeId: "EMP-004", name: "Elena Rostova", role: "Safety Officer", department: "Quality & Safety", status: "Active", dailySalary: 900, advanceAmount: 0, createdAt: new Date().toISOString() },
  { employeeId: "EMP-005", name: "Marcus Vance", role: "Logistics Specialist", department: "Supply Chain", status: "Active", dailySalary: 750, advanceAmount: 1000, createdAt: new Date().toISOString() },
  { employeeId: "EMP-006", name: "James Holden", role: "Structural Technician", department: "Construction", status: "Active", dailySalary: 800, advanceAmount: 500, createdAt: new Date().toISOString() },
];

const today = new Date().toLocaleDateString("sv");

let mockAttendance: MockAttendance[] = [
  {
    date: today,
    session: 1,
    records: [
      { employeeId: "EMP-001", employeeName: "Alex Mercer", status: "Present", timestamp: new Date().toISOString() },
      { employeeId: "EMP-002", employeeName: "Sarah Connor", status: "Present", timestamp: new Date().toISOString() },
      { employeeId: "EMP-003", employeeName: "David Miller", status: "Present", timestamp: new Date().toISOString() },
      { employeeId: "EMP-004", employeeName: "Elena Rostova", status: "Absent", timestamp: new Date().toISOString() },
      { employeeId: "EMP-005", employeeName: "Marcus Vance", status: "Present", timestamp: new Date().toISOString() },
      { employeeId: "EMP-006", employeeName: "James Holden", status: "Present", timestamp: new Date().toISOString() },
    ],
    updatedAt: new Date().toISOString()
  },
  {
    date: today,
    session: 2,
    records: [
      { employeeId: "EMP-001", employeeName: "Alex Mercer", status: "Present", timestamp: new Date().toISOString() },
      { employeeId: "EMP-002", employeeName: "Sarah Connor", status: "Present", timestamp: new Date().toISOString() },
      { employeeId: "EMP-003", employeeName: "David Miller", status: "Absent", timestamp: new Date().toISOString() },
      { employeeId: "EMP-004", employeeName: "Elena Rostova", status: "Present", timestamp: new Date().toISOString() },
      { employeeId: "EMP-005", employeeName: "Marcus Vance", status: "Present", timestamp: new Date().toISOString() },
      { employeeId: "EMP-006", employeeName: "James Holden", status: "Present", timestamp: new Date().toISOString() },
    ],
    updatedAt: new Date().toISOString()
  }
];

let mockOrders: MockOrder[] = [
  {
    orderId: "ORD-8901",
    customerName: "Apex Horizon Towers",
    customerPhone: "+91 98765 43210",
    customerEmail: "procurement@apexhorizon.com",
    items: [
      { name: "High-Density Concrete Bricks (10k Batch)", quantity: 5, unitPrice: 24000, costPrice: 16000 },
      { name: "Reinforced Steel Support Beams", quantity: 12, unitPrice: 8500, costPrice: 5500 }
    ],
    status: "In Progress",
    revenue: 222000,
    costs: { materials: 146000, labor: 28000, overhead: 12000, shipping: 8000 },
    marginAdjustment: 0,
    netProfit: 28000,
    profitMarginPercent: 12.61,
    notes: "Express delivery batch for Sector 7 site",
    date: today,
    createdAt: new Date().toISOString()
  },
  {
    orderId: "ORD-8902",
    customerName: "Vanguard Logistics Center",
    customerPhone: "+91 95669 57474",
    customerEmail: "orders@vanguardlog.com",
    items: [
      { name: "Paving Interlocking Bricks (Grade A)", quantity: 20, unitPrice: 9500, costPrice: 6200 },
      { name: "Industrial Cement Sealant 50L", quantity: 8, unitPrice: 3200, costPrice: 1900 }
    ],
    status: "Delivered",
    revenue: 215600,
    costs: { materials: 139200, labor: 22000, overhead: 9500, shipping: 6500 },
    marginAdjustment: 3500, // Positive adjustment calibrated
    netProfit: 41400,
    profitMarginPercent: 19.20,
    notes: "Delivered on schedule. ₹3,500 bonus rebate calibrated.",
    date: today,
    createdAt: new Date().toISOString()
  },
  {
    orderId: "ORD-8903",
    customerName: "Metro Urban Infrastructure",
    customerPhone: "+91 94432 10987",
    customerEmail: "contact@metrourban.org",
    items: [
      { name: "Acoustic Insulation Masonry Units", quantity: 15, unitPrice: 11000, costPrice: 8000 }
    ],
    status: "In Progress",
    revenue: 165000,
    costs: { materials: 120000, labor: 21000, overhead: 11000, shipping: 9000 },
    marginAdjustment: -2000, // Calibrated loss surcharge adjustment
    netProfit: 3000,
    profitMarginPercent: 1.82,
    notes: "Margin tight due to unexpected freight surge. Requires calibration review.",
    date: today,
    createdAt: new Date().toISOString()
  },
  {
    orderId: "ORD-8904",
    customerName: "Skyline Residential Estate",
    customerPhone: "+91 91234 56789",
    customerEmail: "billing@skylineres.com",
    items: [
      { name: "Terracotta Facing Bricks Custom Tint", quantity: 30, unitPrice: 7800, costPrice: 4800 }
    ],
    status: "Delivered",
    revenue: 234000,
    costs: { materials: 144000, labor: 29000, overhead: 11500, shipping: 7500 },
    marginAdjustment: 1000,
    netProfit: 43000,
    profitMarginPercent: 18.38,
    notes: "Completed phase 1 supply",
    date: today,
    createdAt: new Date().toISOString()
  }
];

export interface MockMaterial {
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
  createdAt: string;
}

export interface MockTruckService {
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
  createdAt: string;
}

let mockMaterials: MockMaterial[] = [
  {
    materialId: "MAT-101",
    name: "Industrial Heavy Machinery Oil",
    category: "Oil",
    date: today,
    totalCost: 15400,
    amountPaid: 10000,
    amountDue: 5400,
    paymentStatus: "Partial",
    supplier: "Castrol Industrial Supplies",
    notes: "200L Drum for Hydraulic Brick Presses",
    createdAt: new Date().toISOString()
  },
  {
    materialId: "MAT-102",
    name: "Hardwood Timber Pallets & Beams",
    category: "Wood",
    date: today,
    totalCost: 28500,
    amountPaid: 28500,
    amountDue: 0,
    paymentStatus: "Paid",
    supplier: "Evergreen Timber Works",
    notes: "150 Pallets for brick curing and stacking",
    createdAt: new Date().toISOString()
  },
  {
    materialId: "MAT-103",
    name: "High-Grade Diesel Fuel (Site Generators)",
    category: "Diesel",
    date: today,
    totalCost: 42000,
    amountPaid: 20000,
    amountDue: 22000,
    paymentStatus: "Partial",
    supplier: "Apex Energy & Fuels",
    notes: "500 Liters for kiln generators & excavators",
    createdAt: new Date().toISOString()
  }
];

let mockTrucks: MockTruckService[] = [
  {
    truckId: "TRK-501",
    vehicleNumber: "TN-38-AX-2094",
    driverName: "Ramesh Kumar (Speedy Transport)",
    date: today,
    quantity: 2.6,
    rate: 3000,
    totalPrice: 7800, // 2.6 * 3000
    amountPaid: 5000,
    amountDue: 2800,
    paymentStatus: "Partial",
    tripDetails: "2.6 trips of red clay transport to kiln site",
    notes: "Calculated as 2.6 x 3,000 = ₹7,800",
    createdAt: new Date().toISOString()
  },
  {
    truckId: "TRK-502",
    vehicleNumber: "TN-37-BY-8812",
    driverName: "Suresh Logistics",
    date: today,
    quantity: 4,
    rate: 4500,
    totalPrice: 18000,
    amountPaid: 18000,
    amountDue: 0,
    paymentStatus: "Paid",
    tripDetails: "4 full loads of finished interlocking bricks delivered to Horizon site",
    notes: "Express highway freight fee included",
    createdAt: new Date().toISOString()
  }
];

export interface MockLaborWage {
  name: string;
  rate: number;
  hours: number;
  total: number;
}

export interface MockHoursRent {
  rentId: string;
  date: string;
  partyName: string;
  pricePerHour: number;
  hours: number;
  totalAmount: number;
  padiPaid: number;
  netBalance: number;
  laborWages: MockLaborWage[];
  totalLaborCost: number;
  netProfitMargin: number;
  createdAt: string;
}

let mockHoursRents: MockHoursRent[] = [
  {
    rentId: "RENT-901",
    date: "2026-08-01",
    partyName: "Selvaraj",
    pricePerHour: 1300,
    hours: 8,
    totalAmount: 10400, // 1300 * 8
    padiPaid: 3000,
    netBalance: 7400, // 10400 - 3000
    laborWages: [
      { name: "Operator", rate: 140, hours: 8, total: 1120 },
      { name: "Lab-1", rate: 130, hours: 8, total: 1040 },
      { name: "Lab-2", rate: 130, hours: 8, total: 1040 },
      { name: "Lab-3", rate: 130, hours: 8, total: 1040 },
      { name: "Lab-4", rate: 130, hours: 8, total: 1040 }
    ],
    totalLaborCost: 5280, // 1120 + 4*1040
    netProfitMargin: 5120, // 10400 - 5280
    createdAt: new Date().toISOString()
  }
];

export const memoryStore = {
  getEmployees: () => mockEmployees,
  setEmployees: (employees: MockEmployee[]) => { mockEmployees = employees; },
  addEmployee: (employee: MockEmployee) => {
    mockEmployees = [employee, ...mockEmployees];
    return employee;
  },
  updateEmployee: (id: string, updates: Partial<MockEmployee>) => {
    mockEmployees = mockEmployees.map(e => e.employeeId === id ? { ...e, ...updates } : e);
    return mockEmployees.find(e => e.employeeId === id);
  },

  getAttendance: (date: string, session: number) => {
    return mockAttendance.find(a => a.date === date && a.session === session);
  },
  saveAttendance: (date: string, session: number, records: MockAttendanceRecord[]) => {
    const existingIndex = mockAttendance.findIndex(a => a.date === date && a.session === session);
    const updatedRecord: MockAttendance = {
      date,
      session,
      records,
      updatedAt: new Date().toISOString()
    };
    if (existingIndex >= 0) {
      mockAttendance[existingIndex] = updatedRecord;
    } else {
      mockAttendance.push(updatedRecord);
    }
    return updatedRecord;
  },

  getOrders: () => mockOrders,
  getOrderById: (orderId: string) => mockOrders.find(o => o.orderId === orderId),
  addOrder: (order: MockOrder) => {
    mockOrders = [order, ...mockOrders];
    return order;
  },
  updateOrder: (orderId: string, updates: Partial<MockOrder>) => {
    mockOrders = mockOrders.map(o => {
      if (o.orderId === orderId) {
        const updated = { ...o, ...updates };
        const totalCosts = (updated.costs.materials || 0) + (updated.costs.labor || 0) + (updated.costs.overhead || 0) + (updated.costs.shipping || 0);
        const netProfit = (updated.revenue || 0) - totalCosts + (updated.marginAdjustment || 0);
        const profitMarginPercent = updated.revenue > 0 ? (netProfit / updated.revenue) * 100 : 0;
        return {
          ...updated,
          netProfit: Number(netProfit.toFixed(2)),
          profitMarginPercent: Number(profitMarginPercent.toFixed(2))
        };
      }
      return o;
    });
    return mockOrders.find(o => o.orderId === orderId);
  },
  deleteOrder: (orderId: string) => {
    mockOrders = mockOrders.filter(o => o.orderId !== orderId);
  },

  // --- MATERIALS ---
  getMaterials: () => mockMaterials,
  getMaterialById: (id: string) => mockMaterials.find(m => m.materialId === id),
  addMaterial: (mat: MockMaterial) => {
    mockMaterials = [mat, ...mockMaterials];
    return mat;
  },
  updateMaterial: (id: string, updates: Partial<MockMaterial>) => {
    mockMaterials = mockMaterials.map(m => {
      if (m.materialId === id) {
        const updated = { ...m, ...updates };
        const totalCost = updated.totalCost ?? 0;
        const amountPaid = updated.amountPaid ?? 0;
        const amountDue = Math.max(0, totalCost - amountPaid);
        let paymentStatus: "Paid" | "Partial" | "Pending" = "Pending";
        if (amountPaid >= totalCost && totalCost > 0) paymentStatus = "Paid";
        else if (amountPaid > 0) paymentStatus = "Partial";

        return {
          ...updated,
          amountDue,
          paymentStatus
        };
      }
      return m;
    });
    return mockMaterials.find(m => m.materialId === id);
  },
  deleteMaterial: (id: string) => {
    mockMaterials = mockMaterials.filter(m => m.materialId !== id);
  },

  // --- TRUCK SERVICES ---
  getTrucks: () => mockTrucks,
  getTruckById: (id: string) => mockTrucks.find(t => t.truckId === id),
  addTruck: (trk: MockTruckService) => {
    mockTrucks = [trk, ...mockTrucks];
    return trk;
  },
  updateTruck: (id: string, updates: Partial<MockTruckService>) => {
    mockTrucks = mockTrucks.map(t => {
      if (t.truckId === id) {
        const updated = { ...t, ...updates };
        const quantity = updated.quantity ?? 0;
        const rate = updated.rate ?? 0;
        const totalPrice = updated.totalPrice !== undefined ? updated.totalPrice : (quantity * rate);
        const amountPaid = updated.amountPaid ?? 0;
        const amountDue = Math.max(0, totalPrice - amountPaid);
        let paymentStatus: "Paid" | "Partial" | "Pending" = "Pending";
        if (amountPaid >= totalPrice && totalPrice > 0) paymentStatus = "Paid";
        else if (amountPaid > 0) paymentStatus = "Partial";

        return {
          ...updated,
          totalPrice,
          amountDue,
          paymentStatus
        };
      }
      return t;
    });
    return mockTrucks.find(t => t.truckId === id);
  },
  deleteTruck: (id: string) => {
    mockTrucks = mockTrucks.filter(t => t.truckId !== id);
  },

  // --- HOURS RENT & LABOR SPLITTER ---
  getHoursRents: () => mockHoursRents,
  addHoursRent: (rent: MockHoursRent) => {
    mockHoursRents = [rent, ...mockHoursRents];
    return rent;
  },
  deleteHoursRent: (id: string) => {
    mockHoursRents = mockHoursRents.filter(r => r.rentId !== id);
  },

  resetToDefaults: () => {
    // re-initialize seed
  }
};


