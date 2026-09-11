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

let mockEmployees: MockEmployee[] = [];

const today = new Date().toLocaleDateString("sv");

let mockAttendance: MockAttendance[] = [];

let mockOrders: MockOrder[] = [];

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

let mockMaterials: MockMaterial[] = [];

let mockTrucks: MockTruckService[] = [];

export interface MockLaborWage {
  name: string;
  rate: number;
  hours: number;
  advance?: number;
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
  dieselCost?: number;
  dieselLiters?: number;
  netProfitMargin: number;
  createdAt: string;
}

let mockHoursRents: MockHoursRent[] = [];

export interface MockWeeklyDailyRecord {
  date: string;
  dayName: string;
  status: "P" | "A" | "0.5" | "";
  advance: number;
}

export interface MockWeeklyWorkerRow {
  employeeId: string;
  employeeName: string;
  role?: string;
  dailySalary: number;
  dailyRecords: MockWeeklyDailyRecord[];
  totalWorkingDays: number;
  totalWeekSalary: number;
  totalAdvance: number;
  balance: number;
}

export interface MockTeamExtraExpense {
  id?: string;
  description: string;
  amount: number;
}

export interface MockWeeklyTeamGroup {
  teamName: string;
  oldBalance?: number;
  extraExpenses?: MockTeamExtraExpense[];
  members: MockWeeklyWorkerRow[];
  totalTeamDays: number;
  totalTeamSalary: number;
  totalTeamAdvance: number;
  totalTeamBalance: number;
  totalTeamExtraExpenses: number;
  grandTotalPayable: number;
}

export interface MockWeeklyTeamRegister {
  weekId: string;
  startDate: string;
  endDate: string;
  monthName: string;
  year: number;
  teams: MockWeeklyTeamGroup[];
  notes?: string;
  updatedAt: string;
}

let mockWeeklyRegisters: MockWeeklyTeamRegister[] = [];

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
  deleteEmployee: (id: string) => {
    mockEmployees = mockEmployees.filter(e => e.employeeId !== id);
    return true;
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

  getWeeklyRegister: (startDate: string) => {
    return mockWeeklyRegisters.find(r => r.startDate === startDate);
  },
  saveWeeklyRegister: (register: MockWeeklyTeamRegister) => {
    const existingIndex = mockWeeklyRegisters.findIndex(r => r.startDate === register.startDate);
    const updated = {
      ...register,
      updatedAt: new Date().toISOString()
    };
    if (existingIndex >= 0) {
      mockWeeklyRegisters[existingIndex] = updated;
    } else {
      mockWeeklyRegisters.push(updated);
    }
    return updated;
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
  updateHoursRent: (id: string, updates: Partial<MockHoursRent>) => {
    mockHoursRents = mockHoursRents.map(r => {
      if (r.rentId === id) {
        const newPadiPaid = updates.padiPaid !== undefined ? updates.padiPaid : r.padiPaid;
        const newNetBalance = Math.max(0, r.totalAmount - newPadiPaid);
        return {
          ...r,
          ...updates,
          padiPaid: newPadiPaid,
          netBalance: newNetBalance,
        };
      }
      return r;
    });
    return mockHoursRents.find(r => r.rentId === id);
  },
  deleteHoursRent: (id: string) => {
    mockHoursRents = mockHoursRents.filter(r => r.rentId !== id);
  },

  resetToDefaults: () => {
    // re-initialize seed
  }
};
