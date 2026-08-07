import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { EmployeeModel } from "@/lib/models";
import { memoryStore } from "@/lib/store";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Employee ID required" },
        { status: 400 }
      );
    }

    const { isMock } = await connectToDatabase();
    if (isMock) {
      memoryStore.deleteEmployee(id);
      return NextResponse.json({ success: true, message: "Employee removed from roster", isMock: true });
    }

    const deleted = await EmployeeModel.findOneAndDelete({
      $or: [{ employeeId: id }, { _id: id }],
    });

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Employee removed from roster", isMock: false });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete employee" },
      { status: 500 }
    );
  }
}
