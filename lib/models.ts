import mongoose, { Schema, Document, Model } from "mongoose";

// --- EMPLOYEE MODEL ---
export interface IEmployee extends Document {
  employeeId: string;
  name: string;
  role: string;
  department: string;
  status: "Active" | "Inactive";
  createdAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>({
  employeeId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  department: { type: String, required: true, default: "General" },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
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
