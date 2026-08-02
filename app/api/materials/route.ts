import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { MaterialModel } from "@/lib/models";
import { MaterialSchemaValidation } from "@/lib/validations";
import { memoryStore } from "@/lib/store";

export async function GET() {
  try {
    const { isMock } = await connectToDatabase();
    if (isMock) {
      const materials = memoryStore.getMaterials();
      return NextResponse.json({ success: true, data: materials, isMock: true });
    }

    const materials = await MaterialModel.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: materials, isMock: false });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch materials" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = MaterialSchemaValidation.parse(body);

    const materialId = `MAT-${Math.floor(100 + Math.random() * 900)}`;
    const totalCost = validatedData.totalCost;
    const amountPaid = validatedData.amountPaid || 0;
    const amountDue = Math.max(0, totalCost - amountPaid);
    
    let paymentStatus: "Paid" | "Partial" | "Pending" = "Pending";
    if (amountPaid >= totalCost && totalCost > 0) paymentStatus = "Paid";
    else if (amountPaid > 0) paymentStatus = "Partial";

    const payload = {
      materialId,
      name: validatedData.name,
      category: validatedData.category || "General",
      date: validatedData.date,
      totalCost,
      amountPaid,
      amountDue,
      paymentStatus,
      supplier: validatedData.supplier || "",
      notes: validatedData.notes || "",
    };

    const { isMock } = await connectToDatabase();
    if (isMock) {
      const newMat = memoryStore.addMaterial({
        ...payload,
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, data: newMat, isMock: true }, { status: 201 });
    }

    const newMat = await MaterialModel.create(payload);
    return NextResponse.json({ success: true, data: newMat, isMock: false }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation Error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create material entry" },
      { status: 500 }
    );
  }
}
