import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { HoursRentModel } from "@/lib/models";
import { memoryStore } from "@/lib/store";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { isMock } = await connectToDatabase();
    if (isMock) {
      const updated = memoryStore.updateHoursRent(id, body);
      return NextResponse.json({ success: true, data: updated, isMock: true });
    }

    const existing = await HoursRentModel.findOne({ rentId: id });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 });
    }

    if (typeof body.padiPaid === "number") {
      existing.padiPaid = body.padiPaid;
      existing.netBalance = Math.max(0, existing.totalAmount - body.padiPaid);
    }
    if (body.partyName) existing.partyName = body.partyName;
    if (body.date) existing.date = body.date;

    await existing.save();
    return NextResponse.json({ success: true, data: existing, isMock: false });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { isMock } = await connectToDatabase();
    if (isMock) {
      memoryStore.deleteHoursRent(id);
      return NextResponse.json({ success: true, message: "Hours rent entry deleted", isMock: true });
    }

    await HoursRentModel.deleteOne({ rentId: id });
    return NextResponse.json({ success: true, message: "Hours rent entry deleted", isMock: false });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete entry" },
      { status: 500 }
    );
  }
}
