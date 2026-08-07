import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { AttendanceModel, EmployeeModel } from "@/lib/models";
import { memoryStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toLocaleDateString("sv");

    const { isMock } = await connectToDatabase();

    let employeesList: any[] = [];
    let sessionsData: any[] = [];
    let allSavedDates: string[] = [];

    if (isMock) {
      employeesList = memoryStore.getEmployees().filter((e) => e.status === "Active");
      // Find all sessions for this date
      const allAttendance = (memoryStore as any).getOrders ? (memoryStore as any).getEmployees() : [];
      // retrieve mock attendance list
      const storeMockAttendance = (memoryStore as any).mockAttendance || [];
      // Let's get stored attendance
      for (let s = 1; s <= 4; s++) {
        const found = memoryStore.getAttendance(date, s);
        if (found) sessionsData.push(found);
      }
      // Get unique available dates
      const mockDates = [date, new Date().toLocaleDateString("sv")];
      allSavedDates = Array.from(new Set(mockDates));
    } else {
      employeesList = await EmployeeModel.find({ status: "Active" }).sort({ name: 1 });
      sessionsData = await AttendanceModel.find({ date });
      
      const distinctDates = await AttendanceModel.distinct("date");
      allSavedDates = distinctDates.length > 0 ? distinctDates.sort().reverse() : [date];
    }

    if (!allSavedDates.includes(date)) {
      allSavedDates.unshift(date);
    }

    // Map each employee and aggregate attendance across sessions 1..4
    const employeeReports = employeesList.map((emp) => {
      const empId = emp.employeeId;
      const empName = emp.name;
      const empRole = emp.role || "Staff";
      const empDept = emp.department || "General";
      const dailySalary = Number(emp.dailySalary) || 0;
      const advanceAmount = Number(emp.advanceAmount) || 0;

      // Track status for sessions 1, 2, 3, 4
      const sessionStatus = {
        s1: false,
        s2: false,
        s3: false,
        s4: false,
      };

      let sessionsAttended = 0;

      for (let s = 1; s <= 4; s++) {
        const sDoc = sessionsData.find((doc) => Number(doc.session) === s);
        if (sDoc && sDoc.records) {
          const rec = sDoc.records.find((r: any) => r.employeeId === empId);
          if (rec && rec.status === "Present") {
            sessionsAttended += 1;
            if (s === 1) sessionStatus.s1 = true;
            if (s === 2) sessionStatus.s2 = true;
            if (s === 3) sessionStatus.s3 = true;
            if (s === 4) sessionStatus.s4 = true;
          }
        }
      }

      // Work credit: 4 sessions = 1.0 day, 3 sessions = 0.75 day, 2 sessions = 0.5 day, 1 session = 0.25 day
      const workCredit = sessionsAttended / 4;
      const earnedSalary = Math.round(workCredit * dailySalary);
      const netPayable = Math.max(0, earnedSalary - advanceAmount);

      let dayStatus: "Full Day" | "3/4 Day" | "Half Day" | "1/4 Day" | "Absent" = "Absent";
      if (sessionsAttended === 4) dayStatus = "Full Day";
      else if (sessionsAttended === 3) dayStatus = "3/4 Day";
      else if (sessionsAttended === 2) dayStatus = "Half Day";
      else if (sessionsAttended === 1) dayStatus = "1/4 Day";

      return {
        employeeId: empId,
        employeeName: empName,
        role: empRole,
        department: empDept,
        dailySalary,
        advanceAmount,
        sessionStatus,
        sessionsAttended,
        workCredit,
        dayStatus,
        earnedSalary,
        netPayable,
      };
    });

    // Summary calculations
    const totalEmployees = employeeReports.length;
    const presentCount = employeeReports.filter((r) => r.sessionsAttended > 0).length;
    const fullDayCount = employeeReports.filter((r) => r.sessionsAttended === 4).length;
    const halfDayCount = employeeReports.filter((r) => r.sessionsAttended === 2).length;
    const absentCount = employeeReports.filter((r) => r.sessionsAttended === 0).length;

    const totalDailySalary = employeeReports.reduce((acc, r) => acc + r.earnedSalary, 0);
    const totalAdvance = employeeReports.reduce((acc, r) => acc + r.advanceAmount, 0);
    const totalNetPayable = employeeReports.reduce((acc, r) => acc + r.netPayable, 0);
    const overallPresenceRate =
      totalEmployees > 0
        ? Math.round(
            (employeeReports.reduce((acc, r) => acc + r.sessionsAttended, 0) /
              (totalEmployees * 4)) *
              100
          )
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        date,
        summary: {
          totalEmployees,
          presentCount,
          fullDayCount,
          halfDayCount,
          absentCount,
          totalDailySalary,
          totalAdvance,
          totalNetPayable,
          overallPresenceRate,
        },
        employeeReports,
        availableDates: allSavedDates,
      },
      isMock,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate daily report" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, advanceAmount, dailySalary } = body;

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: "Employee ID is required" },
        { status: 400 }
      );
    }

    const { isMock } = await connectToDatabase();

    if (isMock) {
      const updated = memoryStore.updateEmployee(employeeId, {
        ...(advanceAmount !== undefined ? { advanceAmount: Number(advanceAmount) } : {}),
        ...(dailySalary !== undefined ? { dailySalary: Number(dailySalary) } : {}),
      });
      return NextResponse.json({ success: true, data: updated, isMock: true });
    }

    const updatePayload: any = {};
    if (advanceAmount !== undefined) updatePayload.advanceAmount = Number(advanceAmount);
    if (dailySalary !== undefined) updatePayload.dailySalary = Number(dailySalary);

    const updated = await EmployeeModel.findOneAndUpdate(
      { employeeId },
      { $set: updatePayload },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated, isMock: false });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update employee daily report settings" },
      { status: 500 }
    );
  }
}
