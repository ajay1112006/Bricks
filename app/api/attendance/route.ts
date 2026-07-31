import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { AttendanceModel, EmployeeModel } from "@/lib/models";
import { BatchAttendanceSchemaValidation } from "@/lib/validations";
import { memoryStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toLocaleDateString("sv");
    const session = parseInt(searchParams.get("session") || "1", 10);

    if (session < 1 || session > 4) {
      return NextResponse.json(
        { success: false, error: "Session must be between 1 and 4" },
        { status: 400 }
      );
    }

    const { isMock } = await connectToDatabase();
    if (isMock) {
      const attendance = memoryStore.getAttendance(date, session);
      const employees = memoryStore.getEmployees().filter(e => e.status === "Active");
      
      // If attendance for session exists, map it; otherwise return default empty structure ready for mark-in
      const existingRecords = attendance?.records || [];
      const mergedRecords = employees.map(emp => {
        const found = existingRecords.find(r => r.employeeId === emp.employeeId);
        return {
          employeeId: emp.employeeId,
          employeeName: emp.name,
          role: emp.role,
          department: emp.department,
          status: found ? found.status : ("Present" as const), // Default to Present for quick mark-in
          notes: found?.notes || ""
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          date,
          session,
          records: mergedRecords,
          isSaved: !!attendance
        },
        isMock: true
      });
    }

    // Real MongoDB query
    const attendanceDoc = await AttendanceModel.findOne({ date, session });
    const employees = await EmployeeModel.find({ status: "Active" }).sort({ name: 1 });

    const existingRecords = attendanceDoc?.records || [];
    const mergedRecords = employees.map(emp => {
      const found = existingRecords.find(r => r.employeeId === emp.employeeId);
      return {
        employeeId: emp.employeeId,
        employeeName: emp.name,
        role: emp.role,
        department: emp.department,
        status: found ? found.status : ("Present" as const),
        notes: found?.notes || ""
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        date,
        session,
        records: mergedRecords,
        isSaved: !!attendanceDoc
      },
      isMock: false
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = BatchAttendanceSchemaValidation.parse(body);

    const { isMock } = await connectToDatabase();
    if (isMock) {
      const formattedRecords = validated.records.map(r => ({
        ...r,
        timestamp: new Date().toISOString()
      }));
      const saved = memoryStore.saveAttendance(validated.date, validated.session, formattedRecords);
      return NextResponse.json({ success: true, data: saved, isMock: true });
    }

    const updated = await AttendanceModel.findOneAndUpdate(
      { date: validated.date, session: validated.session },
      {
        date: validated.date,
        session: validated.session,
        records: validated.records.map(r => ({
          ...r,
          timestamp: new Date()
        })),
        updatedAt: new Date()
      },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: updated, isMock: false });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation Error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save attendance" },
      { status: 500 }
    );
  }
}
