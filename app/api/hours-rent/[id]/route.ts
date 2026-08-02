import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { HoursRentModel } from "@/lib/models";
import { memoryStore } from "@/lib/store";

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
