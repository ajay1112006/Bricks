import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { EmployeeModel, AttendanceModel, OrderModel, WeeklyTeamRegisterModel, MaterialModel, TruckServiceModel, HoursRentModel } from "@/lib/models";
import { memoryStore } from "@/lib/store";

export async function DELETE() {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, message: "Database purge is disabled in production to protect real live database records." },
        { status: 403 }
      );
    }

    const { isMock } = await connectToDatabase();

    if (isMock) {
      memoryStore.setEmployees([]);
      (memoryStore as any).mockAttendance = [];
      (memoryStore as any).mockOrders = [];
      (memoryStore as any).mockMaterials = [];
      (memoryStore as any).mockTrucks = [];
      (memoryStore as any).mockHoursRents = [];
      (memoryStore as any).mockWeeklyRegisters = [];

      return NextResponse.json({
        success: true,
        message: "All fake/mock data cleared successfully from memory store!",
        isMock: true,
      });
    }

    // Clear all MongoDB collections (dev only)
    await EmployeeModel.deleteMany({});
    await AttendanceModel.deleteMany({});
    await OrderModel.deleteMany({});
    await WeeklyTeamRegisterModel.deleteMany({});
    await MaterialModel.deleteMany({});
    await TruckServiceModel.deleteMany({});
    await HoursRentModel.deleteMany({});

    return NextResponse.json({
      success: true,
      message: "Development database reset complete.",
      isMock: false,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  return DELETE();
}
