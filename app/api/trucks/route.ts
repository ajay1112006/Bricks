import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { TruckServiceModel } from "@/lib/models";
import { TruckServiceSchemaValidation } from "@/lib/validations";
import { memoryStore } from "@/lib/store";

export async function GET() {
  try {
    const { isMock } = await connectToDatabase();
    if (isMock) {
      const trucks = memoryStore.getTrucks();
      return NextResponse.json({ success: true, data: trucks, isMock: true });
    }

    const trucks = await TruckServiceModel.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: trucks, isMock: false });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch truck services" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = TruckServiceSchemaValidation.parse(body);

    const truckId = `TRK-${Math.floor(100 + Math.random() * 900)}`;
    const quantity = validatedData.quantity;
    const rate = validatedData.rate;
    const totalPrice = validatedData.totalPrice !== undefined ? validatedData.totalPrice : (quantity * rate);
    const amountPaid = validatedData.amountPaid || 0;
    const amountDue = Math.max(0, totalPrice - amountPaid);
    
    let paymentStatus: "Paid" | "Partial" | "Pending" = "Pending";
    if (amountPaid >= totalPrice && totalPrice > 0) paymentStatus = "Paid";
    else if (amountPaid > 0) paymentStatus = "Partial";

    const payload = {
      truckId,
      vehicleNumber: validatedData.vehicleNumber,
      driverName: validatedData.driverName,
      date: validatedData.date,
      quantity,
      rate,
      totalPrice,
      amountPaid,
      amountDue,
      paymentStatus,
      tripDetails: validatedData.tripDetails || "",
      notes: validatedData.notes || "",
    };

    const { isMock } = await connectToDatabase();
    if (isMock) {
      const newTruck = memoryStore.addTruck({
        ...payload,
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, data: newTruck, isMock: true }, { status: 201 });
    }

    const newTruck = await TruckServiceModel.create(payload);
    return NextResponse.json({ success: true, data: newTruck, isMock: false }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation Error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create truck service entry" },
      { status: 500 }
    );
  }
}
