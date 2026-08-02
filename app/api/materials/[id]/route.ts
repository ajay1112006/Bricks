import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { MaterialModel } from "@/lib/models";
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
      const updated = memoryStore.updateMaterial(id, body);
      if (!updated) {
        return NextResponse.json({ success: false, error: "Material not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updated, isMock: true });
    }

    const existing = await MaterialModel.findOne({ materialId: id });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Material not found" }, { status: 404 });
    }

    if (body.name !== undefined) existing.name = body.name;
    if (body.category !== undefined) existing.category = body.category;
    if (body.date !== undefined) existing.date = body.date;
    if (body.totalCost !== undefined) existing.totalCost = body.totalCost;
    if (body.amountPaid !== undefined) existing.amountPaid = body.amountPaid;
    if (body.supplier !== undefined) existing.supplier = body.supplier;
    if (body.notes !== undefined) existing.notes = body.notes;

    const totalCost = existing.totalCost;
    const amountPaid = existing.amountPaid;
    existing.amountDue = Math.max(0, totalCost - amountPaid);
    
    if (amountPaid >= totalCost && totalCost > 0) existing.paymentStatus = "Paid";
    else if (amountPaid > 0) existing.paymentStatus = "Partial";
    else existing.paymentStatus = "Pending";

    await existing.save();
    return NextResponse.json({ success: true, data: existing, isMock: false });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update material entry" },
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
      memoryStore.deleteMaterial(id);
      return NextResponse.json({ success: true, message: "Material deleted", isMock: true });
    }

    await MaterialModel.deleteOne({ materialId: id });
    return NextResponse.json({ success: true, message: "Material deleted", isMock: false });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete material" },
      { status: 500 }
    );
  }
}
