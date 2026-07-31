import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { OrderModel } from "@/lib/models";
import { CreateOrderSchemaValidation } from "@/lib/validations";
import { memoryStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    const { isMock } = await connectToDatabase();
    if (isMock) {
      let orders = memoryStore.getOrders();
      if (statusFilter && statusFilter !== "All") {
        orders = orders.filter(o => o.status === statusFilter);
      }
      return NextResponse.json({ success: true, data: orders, isMock: true });
    }

    const query = statusFilter && statusFilter !== "All" ? { status: statusFilter } : {};
    const orders = await OrderModel.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: orders, isMock: false });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = CreateOrderSchemaValidation.parse(body);

    // Calculate revenue from items if not provided or to ensure accuracy
    const calculatedRevenue = validated.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalCosts = (validated.costs.materials || 0) + (validated.costs.labor || 0) + (validated.costs.overhead || 0) + (validated.costs.shipping || 0);
    
    const revenue = calculatedRevenue > 0 ? calculatedRevenue : 0;
    const netProfit = Number((revenue - totalCosts + (validated.marginAdjustment || 0)).toFixed(2));
    const profitMarginPercent = revenue > 0 ? Number(((netProfit / revenue) * 100).toFixed(2)) : 0;

    const orderPayload = {
      ...validated,
      revenue,
      netProfit,
      profitMarginPercent,
    };

    const { isMock } = await connectToDatabase();
    if (isMock) {
      const created = memoryStore.addOrder({
        ...orderPayload,
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, data: created, isMock: true }, { status: 201 });
    }

    const existing = await OrderModel.findOne({ orderId: validated.orderId });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Order ID already exists" },
        { status: 400 }
      );
    }

    const created = await OrderModel.create(orderPayload);
    return NextResponse.json({ success: true, data: created, isMock: false }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation Error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
