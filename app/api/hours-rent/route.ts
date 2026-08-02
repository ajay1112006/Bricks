import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { HoursRentModel } from "@/lib/models";
import { HoursRentSchemaValidation } from "@/lib/validations";
import { memoryStore } from "@/lib/store";

export async function GET() {
  try {
    const { isMock } = await connectToDatabase();
    if (isMock) {
      const entries = memoryStore.getHoursRents();
      return NextResponse.json({ success: true, data: entries, isMock: true });
    }

    const entries = await HoursRentModel.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: entries, isMock: false });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch hours rent entries" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = HoursRentSchemaValidation.parse(body);

    const rentId = `RENT-${Math.floor(100 + Math.random() * 900)}`;
    const totalAmount = validatedData.pricePerHour * validatedData.hours;
    const padiPaid = validatedData.padiPaid || 0;
    const netBalance = Math.max(0, totalAmount - padiPaid);

    // Calculate labor wages
    const processedLaborWages = (validatedData.laborWages || []).map((w) => ({
      name: w.name,
      rate: w.rate,
      hours: w.hours,
      total: w.rate * w.hours,
    }));

    const totalLaborCost = processedLaborWages.reduce((acc, curr) => acc + curr.total, 0);
    const netProfitMargin = totalAmount - totalLaborCost;

    const payload = {
      rentId,
      date: validatedData.date,
      partyName: validatedData.partyName,
      pricePerHour: validatedData.pricePerHour,
      hours: validatedData.hours,
      totalAmount,
      padiPaid,
      netBalance,
      laborWages: processedLaborWages,
      totalLaborCost,
      netProfitMargin,
    };

    const { isMock } = await connectToDatabase();
    if (isMock) {
      const newRent = memoryStore.addHoursRent({
        ...payload,
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, data: newRent, isMock: true }, { status: 201 });
    }

    const newRent = await HoursRentModel.create(payload);
    return NextResponse.json({ success: true, data: newRent, isMock: false }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation Error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create hours rent entry" },
      { status: 500 }
    );
  }
}
