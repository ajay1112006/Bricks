import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { EmployeeModel, AttendanceModel, OrderModel } from "@/lib/models";
import { memoryStore } from "@/lib/store";

const SEED_EMPLOYEES = [
  { employeeId: "EMP-001", name: "Alex Mercer", role: "Senior Mason", department: "Construction", status: "Active" },
  { employeeId: "EMP-002", name: "Sarah Connor", role: "Project Manager", department: "Operations", status: "Active" },
  { employeeId: "EMP-003", name: "David Miller", role: "Site Supervisor", department: "Field Ops", status: "Active" },
  { employeeId: "EMP-004", name: "Elena Rostova", role: "Safety Officer", department: "Quality & Safety", status: "Active" },
  { employeeId: "EMP-005", name: "Marcus Vance", role: "Logistics Specialist", department: "Supply Chain", status: "Active" },
  { employeeId: "EMP-006", name: "James Holden", role: "Structural Technician", department: "Construction", status: "Active" },
];

const today = new Date().toLocaleDateString("sv");

const SEED_ORDERS = [
  {
    orderId: "ORD-8901",
    customerName: "Apex Horizon Towers",
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
    date: today
  },
  {
    orderId: "ORD-8902",
    customerName: "Vanguard Logistics Center",
    customerEmail: "orders@vanguardlog.com",
    items: [
      { name: "Paving Interlocking Bricks (Grade A)", quantity: 20, unitPrice: 9500, costPrice: 6200 },
      { name: "Industrial Cement Sealant 50L", quantity: 8, unitPrice: 3200, costPrice: 1900 }
    ],
    status: "Delivered",
    revenue: 215600,
    costs: { materials: 139200, labor: 22000, overhead: 9500, shipping: 6500 },
    marginAdjustment: 3500,
    netProfit: 41400,
    profitMarginPercent: 19.20,
    notes: "Delivered on schedule. ₹3,500 bonus rebate calibrated.",
    date: today
  },
  {
    orderId: "ORD-8903",
    customerName: "Metro Urban Infrastructure",
    customerEmail: "contact@metrourban.org",
    items: [
      { name: "Acoustic Insulation Masonry Units", quantity: 15, unitPrice: 11000, costPrice: 8000 }
    ],
    status: "In Progress",
    revenue: 165000,
    costs: { materials: 120000, labor: 21000, overhead: 11000, shipping: 9000 },
    marginAdjustment: -2000,
    netProfit: 3000,
    profitMarginPercent: 1.82,
    notes: "Margin tight due to unexpected freight surge. Requires calibration review.",
    date: today
  },
  {
    orderId: "ORD-8904",
    customerName: "Skyline Residential Estate",
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
    date: today
  }
];

export async function POST() {
  try {
    const { isMock } = await connectToDatabase();

    if (isMock) {
      // Memory store is already populated with seed data
      return NextResponse.json({
        success: true,
        message: "Seed data initialized in Mock Store",
        isMock: true
      });
    }

    // Populate MongoDB
    await EmployeeModel.deleteMany({});
    await AttendanceModel.deleteMany({});
    await OrderModel.deleteMany({});

    const employees = await EmployeeModel.insertMany(SEED_EMPLOYEES);

    // Initial attendance seed for today
    await AttendanceModel.create({
      date: today,
      session: 1,
      records: employees.map(emp => ({
        employeeId: emp.employeeId,
        employeeName: emp.name,
        status: "Present",
        timestamp: new Date()
      }))
    });

    const orders = await OrderModel.insertMany(SEED_ORDERS);

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      stats: {
        employeesCount: employees.length,
        ordersCount: orders.length
      },
      isMock: false
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
