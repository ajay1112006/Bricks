import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { OrderModel } from "@/lib/models";
import { CalibrationSchemaValidation } from "@/lib/validations";
import { memoryStore } from "@/lib/store";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = CalibrationSchemaValidation.parse(body);

    const { isMock } = await connectToDatabase();
    if (isMock) {
      const existing = memoryStore.getOrderById(id);
      if (!existing) {
        return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
      }

      const updatedCosts = validated.costs ? { ...existing.costs, ...validated.costs } : existing.costs;
      const updatedRevenue = validated.revenue !== undefined ? validated.revenue : existing.revenue;
      const updatedMarginAdjustment = validated.marginAdjustment;

      const updated = memoryStore.updateOrder(id, {
        costs: updatedCosts,
        revenue: updatedRevenue,
        marginAdjustment: updatedMarginAdjustment,
        notes: validated.notes !== undefined ? validated.notes : existing.notes,
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Order P&L calibrated successfully",
        isMock: true
      });
    }

    const order = await OrderModel.findOne({ orderId: id });
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (validated.revenue !== undefined) {
      order.revenue = validated.revenue;
    }
    if (validated.costs) {
      order.costs = { ...order.costs, ...validated.costs };
    }
    order.marginAdjustment = validated.marginAdjustment;
    if (validated.notes !== undefined) {
      order.notes = validated.notes;
    }

    const totalCosts = (order.costs.materials || 0) + (order.costs.labor || 0) + (order.costs.overhead || 0) + (order.costs.shipping || 0);
    order.netProfit = Number((order.revenue - totalCosts + order.marginAdjustment).toFixed(2));
    order.profitMarginPercent = order.revenue > 0 ? Number(((order.netProfit / order.revenue) * 100).toFixed(2)) : 0;

    await order.save();

    return NextResponse.json({
      success: true,
      data: order,
      message: "Order P&L calibrated successfully",
      isMock: false
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation Error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calibrate order financial data" },
      { status: 500 }
    );
  }
}
