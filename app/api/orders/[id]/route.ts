import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { OrderModel } from "@/lib/models";
import { memoryStore } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { isMock } = await connectToDatabase();
    if (isMock) {
      const order = memoryStore.getOrderById(id);
      if (!order) {
        return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: order, isMock: true });
    }

    const order = await OrderModel.findOne({ orderId: id });
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: order, isMock: false });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { isMock } = await connectToDatabase();
    if (isMock) {
      const updated = memoryStore.updateOrder(id, body);
      if (!updated) {
        return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updated, isMock: true });
    }

    const existing = await OrderModel.findOne({ orderId: id });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Apply updates and recalculate profit if financials changed
    if (body.status) existing.status = body.status;
    if (body.customerName) existing.customerName = body.customerName;
    if (body.notes !== undefined) existing.notes = body.notes;
    if (body.costs) existing.costs = { ...existing.costs, ...body.costs };
    if (body.revenue !== undefined) existing.revenue = body.revenue;
    if (body.marginAdjustment !== undefined) existing.marginAdjustment = body.marginAdjustment;

    const totalCosts = (existing.costs.materials || 0) + (existing.costs.labor || 0) + (existing.costs.overhead || 0) + (existing.costs.shipping || 0);
    existing.netProfit = Number((existing.revenue - totalCosts + existing.marginAdjustment).toFixed(2));
    existing.profitMarginPercent = existing.revenue > 0 ? Number(((existing.netProfit / existing.revenue) * 100).toFixed(2)) : 0;

    await existing.save();
    return NextResponse.json({ success: true, data: existing, isMock: false });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
      memoryStore.deleteOrder(id);
      return NextResponse.json({ success: true, message: "Order deleted", isMock: true });
    }

    await OrderModel.deleteOne({ orderId: id });
    return NextResponse.json({ success: true, message: "Order deleted", isMock: false });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
