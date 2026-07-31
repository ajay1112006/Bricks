import { z } from "zod";

// Employee validation
export const EmployeeSchemaValidation = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  employeeId: z.string().optional(),
  role: z.string().default("Staff"),
  department: z.string().default("General"),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

// Attendance Record validation
export const AttendanceRecordSchemaValidation = z.object({
  employeeId: z.string().min(1, "Employee ID required"),
  employeeName: z.string().min(1, "Employee name required"),
  status: z.enum(["Present", "Absent"]),
  notes: z.string().optional(),
});

// Session Attendance batch update validation
export const BatchAttendanceSchemaValidation = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  session: z.number().int().min(1).max(4),
  records: z.array(AttendanceRecordSchemaValidation),
});

// Order validation
export const OrderItemSchemaValidation = z.object({
  name: z.string().min(1, "Item name required"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  unitPrice: z.number().nonnegative("Unit price cannot be negative"),
  costPrice: z.number().nonnegative("Cost price cannot be negative"),
});

export const CostsSchemaValidation = z.object({
  materials: z.number().nonnegative("Materials cost cannot be negative"),
  labor: z.number().nonnegative("Labor cost cannot be negative"),
  overhead: z.number().nonnegative("Overhead cost cannot be negative"),
  shipping: z.number().nonnegative("Shipping cost cannot be negative"),
});

export const CreateOrderSchemaValidation = z.object({
  orderId: z.string().min(3, "Order ID required"),
  customerName: z.string().min(2, "Customer name required"),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  items: z.array(OrderItemSchemaValidation).min(1, "At least one item is required"),
  status: z.enum(["Draft", "In Progress", "Delivered", "Cancelled"]).default("In Progress"),
  costs: CostsSchemaValidation,
  marginAdjustment: z.number().default(0),
  notes: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

export const CalibrationSchemaValidation = z.object({
  revenue: z.number().nonnegative("Revenue cannot be negative").optional(),
  costs: CostsSchemaValidation.optional(),
  marginAdjustment: z.number(),
  notes: z.string().optional(),
});
