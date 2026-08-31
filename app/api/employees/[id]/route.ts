import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { EmployeeModel } from "@/lib/models";
import { memoryStore } from "@/lib/store";

export async function PUT(
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

    const body = await req.json();
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.role !== undefined) updateData.role = body.role.trim();
    if (body.department !== undefined) updateData.department = body.department.trim();
    if (body.dailySalary !== undefined) updateData.dailySalary = Math.max(0, Number(body.dailySalary) || 0);
    if (body.advanceAmount !== undefined) updateData.advanceAmount = Math.max(0, Number(body.advanceAmount) || 0);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { isMock } = await connectToDatabase();
    if (isMock) {
      const updated = memoryStore.updateEmployee(id, updateData);
      if (!updated) {
        return NextResponse.json({ success: false, error: "Employee not found in store" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updated, isMock: true });
    }

    const isMongoId = mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
    const query = isMongoId
      ? { $or: [{ employeeId: id }, { _id: id }] }
      : { employeeId: id };

    const updated = await EmployeeModel.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated, isMock: false });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update employee" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(req, context);
}

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

    return NextResponse.json({ success: true, message: "Employee removed from roster", isMock: false });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete employee" },
      { status: 500 }
    );
  }
}

