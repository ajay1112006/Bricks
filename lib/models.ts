import mongoose, { Schema, Document, Model } from "mongoose";

// --- EMPLOYEE MODEL ---
export interface IEmployee extends Document {
  employeeId: string;
  name: string;
  role: string;
  department: string;
  status: "Active" | "Inactive";
  dailySalary?: number;
  advanceAmount?: number;
  createdAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>({
  employeeId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  department: { type: String, required: true, default: "General" },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  dailySalary: { type: Number, default: 0, min: 0 },
  advanceAmount: { type: Number, default: 0, min: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const EmployeeModel: Model<IEmployee> =
  mongoose.models.Employee || mongoose.model<IEmployee>("Employee", EmployeeSchema);

// --- ATTENDANCE MODEL ---
export interface IAttendanceRecord {
  employeeId: string;
  employeeName: string;
  status: "Present" | "Absent";
  timestamp: Date;
  notes?: string;
}

export interface IAttendance extends Document {
  date: string; // YYYY-MM-DD format
  session: number; // 1, 2, 3, or 4
  records: IAttendanceRecord[];
  updatedAt: Date;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  status: { type: String, enum: ["Present", "Absent"], required: true },
  timestamp: { type: Date, default: Date.now },
  notes: { type: String, default: "" }
}, { _id: false });

const AttendanceSchema = new Schema<IAttendance>({
  date: { type: String, required: true, index: true },
  session: { type: Number, required: true, min: 1, max: 4 },
  records: [AttendanceRecordSchema],
  updatedAt: { type: Date, default: Date.now }
});

// Compound unique index for date + session
AttendanceSchema.index({ date: 1, session: 1 }, { unique: true });

export const AttendanceModel: Model<IAttendance> =
  mongoose.models.Attendance || mongoose.model<IAttendance>("Attendance", AttendanceSchema);

// --- ORDER MODEL ---
export interface IOrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
}

export interface ICosts {
  materials: number;
  labor: number;
  overhead: number;
  shipping: number;
}

export interface IOrder extends Document {
  orderId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  items: IOrderItem[];
  status: "Draft" | "In Progress" | "Delivered" | "Cancelled";
  revenue: number;
  costs: ICosts;
  marginAdjustment: number;
  netProfit: number;
  profitMarginPercent: number;
  notes?: string;
  date: string; // YYYY-MM-DD
  createdAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, required: true, min: 0 }
}, { _id: false });

const CostsSchema = new Schema<ICosts>({
  materials: { type: Number, required: true, default: 0, min: 0 },
  labor: { type: Number, required: true, default: 0, min: 0 },
  overhead: { type: Number, required: true, default: 0, min: 0 },
  shipping: { type: Number, required: true, default: 0, min: 0 }
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  orderId: { type: String, required: true, unique: true, index: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, default: "" },
  customerEmail: { type: String, default: "" },
  items: [OrderItemSchema],
  status: {
    type: String,
    enum: ["Draft", "In Progress", "Delivered", "Cancelled"],
    default: "In Progress"
  },
  revenue: { type: Number, required: true, min: 0 },
  costs: { type: CostsSchema, required: true },
  marginAdjustment: { type: Number, default: 0 },
  netProfit: { type: Number, required: true },
  profitMarginPercent: { type: Number, required: true },
  notes: { type: String, default: "" },
  date: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

export const OrderModel: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

// --- MATERIAL MODEL ---
export interface IMaterial extends Document {
  materialId: string;
  name: string; // e.g. "Oil", "Wood", "Diesel", "Cement", etc.
  category: string; // "Fuel", "Raw Material", "Consumables", "Lubricant"
  date: string; // YYYY-MM-DD
  totalCost: number;
  amountPaid: number;
  amountDue: number; // totalCost - amountPaid
  paymentStatus: "Paid" | "Partial" | "Pending";
  supplier?: string;
  notes?: string;
  createdAt: Date;
}

const MaterialSchema = new Schema<IMaterial>({
  materialId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  category: { type: String, required: true, default: "General" },
  date: { type: String, required: true, index: true },
  totalCost: { type: Number, required: true, min: 0 },
  amountPaid: { type: Number, required: true, min: 0, default: 0 },
  amountDue: { type: Number, required: true, min: 0 },
  paymentStatus: {
    type: String,
    enum: ["Paid", "Partial", "Pending"],
    default: "Pending"
  },
  supplier: { type: String, default: "" },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export const MaterialModel: Model<IMaterial> =
  mongoose.models.Material || mongoose.model<IMaterial>("Material", MaterialSchema);

// --- TRUCK SERVICE MODEL ---
export interface ITruckService extends Document {
  truckId: string;
  vehicleNumber: string; // e.g. "TN-38-AX-2094" or "TRK-104"
  driverName: string;
  date: string; // YYYY-MM-DD
  quantity: number; // e.g. 2.6 (trips/hours/tons)
  rate: number; // e.g. 3000
  totalPrice: number; // e.g. 2.6 * 3000 = 7800
  amountPaid: number;
  amountDue: number;
  paymentStatus: "Paid" | "Partial" | "Pending";
  tripDetails?: string;
  notes?: string;
  createdAt: Date;
}

const TruckServiceSchema = new Schema<ITruckService>({
  truckId: { type: String, required: true, unique: true, index: true },
  vehicleNumber: { type: String, required: true },
  driverName: { type: String, required: true },
  date: { type: String, required: true, index: true },
  quantity: { type: Number, required: true, min: 0 },
  rate: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  amountPaid: { type: Number, required: true, min: 0, default: 0 },
  amountDue: { type: Number, required: true, min: 0 },
  paymentStatus: {
    type: String,
    enum: ["Paid", "Partial", "Pending"],
    default: "Pending"
  },
  tripDetails: { type: String, default: "" },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export const TruckServiceModel: Model<ITruckService> =
  mongoose.models.TruckService || mongoose.model<ITruckService>("TruckService", TruckServiceSchema);

// --- HOURS RENT & LABOR SPLITTER MODEL ---
export interface ILaborWage {
  name: string; // "Operator", "Lab-1", "Lab-2", etc.
  rate: number; // e.g. 140 or 130
  hours: number; // e.g. 8
  advance?: number; // Advance amount received/paid to operator or labor
  total: number; // rate * hours
}

export interface IHoursRent extends Document {
  rentId: string;
  date: string; // e.g. "2026-08-01" or "01.08.2026"
  partyName: string; // e.g. "Selvaraj"
  pricePerHour: number; // e.g. 1300
  hours: number; // e.g. 8
  totalAmount: number; // Price x Hours = 10400
  padiPaid: number; // Padi advance paid = 3000
  netBalance: number; // totalAmount - padiPaid = 7400
  laborWages: ILaborWage[]; // Operator + Lab-1 to Lab-4...
  totalLaborCost: number; // Sum of all labor wages = 5280
  dieselCost?: number; // Diesel price / expense amount
  dieselLiters?: number; // Optional fuel volume in liters
  netProfitMargin: number; // totalAmount - totalLaborCost - dieselCost
  createdAt: Date;
}

const LaborWageSchema = new Schema<ILaborWage>({
  name: { type: String, required: true },
  rate: { type: Number, required: true, min: 0 },
  hours: { type: Number, required: true, min: 0 },
  advance: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 }
}, { _id: false });

const HoursRentSchema = new Schema<IHoursRent>({
  rentId: { type: String, required: true, unique: true, index: true },
  date: { type: String, required: true, index: true },
  partyName: { type: String, required: true },
  pricePerHour: { type: Number, required: true, min: 0 },
  hours: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  padiPaid: { type: Number, required: true, min: 0, default: 0 },
  netBalance: { type: Number, required: true },
  laborWages: [LaborWageSchema],
  totalLaborCost: { type: Number, required: true, min: 0 },
  dieselCost: { type: Number, default: 0, min: 0 },
  dieselLiters: { type: Number, default: 0, min: 0 },
  netProfitMargin: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const HoursRentModel: Model<IHoursRent> =
  mongoose.models.HoursRent || mongoose.model<IHoursRent>("HoursRent", HoursRentSchema);


