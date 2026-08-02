import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { TruckServiceModel } from "@/lib/models";
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
      const updated = memoryStore.updateTruck(id, body);
      if (!updated) {
        return NextResponse.json({ success: false, error: "Truck entry not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updated, isMock: true });
    }

    const existing = await TruckServiceModel.findOne({ truckId: id });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Truck entry not found" }, { status: 404 });
    }

    if (body.vehicleNumber !== undefined) existing.vehicleNumber = body.vehicleNumber;
    if (body.driverName !== undefined) existing.driverName = body.driverName;
    if (body.date !== undefined) existing.date = body.date;
    if (body.quantity !== undefined) existing.quantity = body.quantity;
    if (body.rate !== undefined) existing.rate = body.rate;
    if (body.totalPrice !== undefined) {
      existing.totalPrice = body.totalPrice;
    } else if (body.quantity !== undefined || body.rate !== undefined) {
      existing.totalPrice = existing.quantity * existing.rate;
    }
    if (body.amountPaid !== undefined) existing.amountPaid = body.amountPaid;
    if (body.tripDetails !== undefined) existing.tripDetails = body.tripDetails;
    if (body.notes !== undefined) existing.notes = body.notes;

    const totalPrice = existing.totalPrice;
    const amountPaid = existing.amountPaid;
    existing.amountDue = Math.max(0, totalPrice - amountPaid);

    if (amountPaid >= totalPrice && totalPrice > 0) existing.paymentStatus = "Paid";
    else if (amountPaid > 0) existing.paymentStatus = "Partial";
    else existing.paymentStatus = "Pending";

    await existing.save();
    return NextResponse.json({ success: true, data: existing, isMock: false });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update truck service entry" },
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
      memoryStore.deleteTruck(id);
      return NextResponse.json({ success: true, message: "Truck service deleted", isMock: true });
    }

    await TruckServiceModel.deleteOne({ truckId: id });
    return NextResponse.json({ success: true, message: "Truck service deleted", isMock: false });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete truck service" },
      { status: 500 }
    );
  }
}
