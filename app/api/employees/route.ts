import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { EmployeeModel } from "@/lib/models";
import { EmployeeSchemaValidation } from "@/lib/validations";
import { memoryStore } from "@/lib/store";

export async function GET() {
  try {
    const { isMock } = await connectToDatabase();
    if (isMock) {
      const employees = memoryStore.getEmployees();
      return NextResponse.json({ success: true, data: employees, isMock: true });
    }

    const employees = await EmployeeModel.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: employees, isMock: false });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = EmployeeSchemaValidation.parse(body);

    const employeeId = validatedData.employeeId || `EMP-${Math.floor(100 + Math.random() * 900)}`;
    const employeePayload = {
      ...validatedData,
      employeeId,
      role: validatedData.role || "Staff",
      department: validatedData.department || "General",
      dailySalary: Number(validatedData.dailySalary) || 0,
      advanceAmount: Number(validatedData.advanceAmount) || 0,
    };

    const { isMock } = await connectToDatabase();
    if (isMock) {
      const newEmp = memoryStore.addEmployee({
        ...employeePayload,
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, data: newEmp, isMock: true }, { status: 201 });
    }

    // Check if ID already exists
    const existing = await EmployeeModel.findOne({ employeeId });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Employee ID already exists" },
        { status: 400 }
      );
    }

    const newEmp = await EmployeeModel.create(employeePayload);
    return NextResponse.json({ success: true, data: newEmp, isMock: false }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation Error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create employee" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Employee ID is required" },
        { status: 400 }
      );
    }

    const { isMock } = await connectToDatabase();
    if (isMock) {
      memoryStore.deleteEmployee(id);
      return NextResponse.json({ success: true, message: "Employee deleted successfully", isMock: true });
    }

    const isMongoId = mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
    const query = isMongoId
      ? { $or: [{ employeeId: id }, { _id: id }] }
      : { employeeId: id };

    const deleted = await EmployeeModel.findOneAndDelete(query);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Employee removed successfully", isMock: false });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete employee" },
      { status: 500 }
    );
  }
}
