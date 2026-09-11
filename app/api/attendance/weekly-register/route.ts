import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { EmployeeModel, WeeklyTeamRegisterModel, IWeeklyDailyRecord, IWeeklyTeamGroup, IWeeklyWorkerRow } from "@/lib/models";
import { memoryStore } from "@/lib/store";

// Helper: Calculate Mon to Sat dates for a given starting Monday date (or any date in the week)
function getWeekDays(startDateStr?: string) {
  let start: Date;
  if (startDateStr) {
    start = new Date(startDateStr);
  } else {
    start = new Date();
    const day = start.getDay(); // 0 = Sun, 1 = Mon ...
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    start = new Date(start.setDate(diff));
  }

  // Ensure start is Monday
  const day = start.getDay();
  if (day !== 1) {
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start = new Date(start.setDate(diff));
  }

  const days: { date: string; dayName: string }[] = [];
  const dayNames = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

  for (let i = 0; i < 6; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = d.toLocaleDateString("sv"); // YYYY-MM-DD
    days.push({
      date: dateStr,
      dayName: dayNames[i],
    });
  }

  const end = new Date(start);
  end.setDate(start.getDate() + 5);

  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  return {
    startDate: days[0].date,
    endDate: days[5].date,
    monthName: monthNames[start.getMonth()],
    year: start.getFullYear(),
    days,
  };
}

// Helper: Ensure every worker row has 6 valid dailyRecords (Mon-Sat)
function ensureDailyRecords(members: any[], weekInfoDays: { date: string; dayName: string }[]) {
  return (members || []).map((m: any) => {
    let records = m.dailyRecords;
    if (!Array.isArray(records) || records.length === 0) {
      records = weekInfoDays.map((d) => ({
        date: d.date,
        dayName: d.dayName,
        status: "P",
        advance: 0,
      }));
    } else {
      records = weekInfoDays.map((d) => {
        const existing = records.find((r: any) => r.date === d.date);
        return existing
          ? { date: d.date, dayName: d.dayName, status: existing.status !== undefined ? existing.status : "P", advance: Number(existing.advance) || 0 }
          : { date: d.date, dayName: d.dayName, status: "P", advance: 0 };
      });
    }
    return {
      ...m,
      dailyRecords: records,
    };
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const weekInfo = getWeekDays(startDateParam || undefined);

    const { isMock } = await connectToDatabase();

    if (isMock) {
      const existing = memoryStore.getWeeklyRegister(weekInfo.startDate);
      if (existing) {
        const dataCopy = JSON.parse(JSON.stringify(existing));
        if (dataCopy.teams) {
          dataCopy.teams = dataCopy.teams.map((t: any) => ({
            ...t,
            members: ensureDailyRecords(t.members, weekInfo.days),
          }));
        }
        return NextResponse.json({ success: true, data: dataCopy, isMock: true });
      }

      // Generate default from mock employees
      const employees = memoryStore.getEmployees().filter((e) => e.status === "Active");
      const defaultTeams = buildDefaultTeams(employees, weekInfo.days);

      const template = {
        weekId: `WTR-${weekInfo.startDate}`,
        startDate: weekInfo.startDate,
        endDate: weekInfo.endDate,
        monthName: weekInfo.monthName,
        year: weekInfo.year,
        teams: defaultTeams,
        notes: "",
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json({ success: true, data: template, isMock: true, isTemplate: true });
    }

    // Real Mongo query
    const existingDoc = await WeeklyTeamRegisterModel.findOne({ startDate: weekInfo.startDate });
    if (existingDoc) {
      const docObj = existingDoc.toObject ? existingDoc.toObject() : JSON.parse(JSON.stringify(existingDoc));
      if (docObj.teams) {
        docObj.teams = docObj.teams.map((t: any) => ({
          ...t,
          members: ensureDailyRecords(t.members, weekInfo.days),
        }));
      }
      return NextResponse.json({ success: true, data: docObj, isMock: false });
    }

    // Build template from registered DB employees
    const employees = await EmployeeModel.find({ status: "Active" }).sort({ department: 1, name: 1 });
    const defaultTeams = buildDefaultTeams(employees, weekInfo.days);

    const template = {
      weekId: `WTR-${weekInfo.startDate}`,
      startDate: weekInfo.startDate,
      endDate: weekInfo.endDate,
      monthName: weekInfo.monthName,
      year: weekInfo.year,
      teams: defaultTeams,
      notes: "",
      updatedAt: new Date(),
    };

    return NextResponse.json({ success: true, data: template, isMock: false, isTemplate: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch weekly team register" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { startDate, endDate, monthName, year, teams, notes } = body;

    if (!startDate || !teams || !Array.isArray(teams)) {
      return NextResponse.json(
        { success: false, error: "Invalid weekly register payload. 'startDate' and 'teams' are required." },
        { status: 400 }
      );
    }

    // Recalculate totals for integrity
    const calculatedTeams: IWeeklyTeamGroup[] = teams.map((team: any) => {
      let totalTeamDays = 0;
      let totalTeamSalary = 0;
      let totalTeamAdvance = 0;
      let totalTeamBalance = 0;

      const members: IWeeklyWorkerRow[] = (team.members || []).map((m: any) => {
        let workerDays = 0;
        let workerAdvance = 0;

        const dailyRecords: IWeeklyDailyRecord[] = (m.dailyRecords || []).map((dr: any) => {
          const adv = Number(dr.advance) || 0;
          workerAdvance += adv;

          if (dr.status === "P" || dr.status === "1") {
            workerDays += 1;
          } else if (dr.status === "0.75" || dr.status === ".75" || dr.status === "3/4") {
            workerDays += 0.75;
          } else if (dr.status === "0.5" || dr.status === ".5" || dr.status === "1/2") {
            workerDays += 0.5;
          } else if (dr.status === "0.25" || dr.status === ".25" || dr.status === "1/4") {
            workerDays += 0.25;
          }

          return {
            date: dr.date,
            dayName: dr.dayName,
            status: dr.status || "",
            advance: adv,
          };
        });

        const dailySalary = Number(m.dailySalary) || 0;
        const totalWeekSalary = workerDays * dailySalary;
        const balance = totalWeekSalary - workerAdvance;

        totalTeamDays += workerDays;
        totalTeamSalary += totalWeekSalary;
        totalTeamAdvance += workerAdvance;
        totalTeamBalance += balance;

        return {
          employeeId: m.employeeId || `EMP-${Math.floor(100 + Math.random() * 900)}`,
          employeeName: m.employeeName || "Worker",
          role: m.role || "Labor",
          dailySalary,
          dailyRecords,
          totalWorkingDays: workerDays,
          totalWeekSalary,
          totalAdvance: workerAdvance,
          balance,
        };
      });

      const extraExpenses = (team.extraExpenses || []).map((ex: any) => ({
        id: ex.id || Math.random().toString(36).substring(2, 9),
        description: ex.description || "",
        amount: Number(ex.amount) || 0,
      }));

      const totalTeamExtraExpenses = extraExpenses.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
      const oldBalance = Number(team.oldBalance) || 0;
      const grandTotalPayable = totalTeamBalance + totalTeamExtraExpenses + oldBalance;

      return {
        teamName: team.teamName || "General Team",
        oldBalance,
        extraExpenses,
        members,
        totalTeamDays,
        totalTeamSalary,
        totalTeamAdvance,
        totalTeamBalance,
        totalTeamExtraExpenses,
        grandTotalPayable,
      };
    });

    const weekId = `WTR-${startDate}`;
    const registerPayload = {
      weekId,
      startDate,
      endDate: endDate || getWeekDays(startDate).endDate,
      monthName: monthName || getWeekDays(startDate).monthName,
      year: Number(year) || getWeekDays(startDate).year,
      teams: calculatedTeams,
      notes: notes || "",
      updatedAt: new Date(),
    };

    const { isMock } = await connectToDatabase();

    if (isMock) {
      // Sync salary to mock employees
      for (const t of calculatedTeams) {
        for (const m of t.members) {
          if (m.employeeId && m.dailySalary > 0) {
            memoryStore.updateEmployee(m.employeeId, { dailySalary: m.dailySalary });
          }
        }
      }

      const saved = memoryStore.saveWeeklyRegister({
        ...registerPayload,
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, data: saved, isMock: true });
    }

    const savedDoc = await WeeklyTeamRegisterModel.findOneAndUpdate(
      { startDate },
      { $set: registerPayload },
      { upsert: true, new: true, runValidators: true }
    );

    // Sync updated dailySalary to EmployeeModel master records
    try {
      for (const t of calculatedTeams) {
        for (const m of t.members) {
          if (m.employeeId && m.dailySalary > 0) {
            await EmployeeModel.findOneAndUpdate(
              { employeeId: m.employeeId },
              { $set: { dailySalary: m.dailySalary } }
            );
          }
        }
      }
    } catch (syncErr) {
      console.warn("Could not sync employee master salaries:", syncErr);
    }

    return NextResponse.json({ success: true, data: savedDoc, isMock: false });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save weekly team register" },
      { status: 500 }
    );
  }
}

// Helper: Group employees into Default Teams (e.g., Luccas Team, Prince Team, Gopal Team, General)
function buildDefaultTeams(employees: any[], days: { date: string; dayName: string }[]): IWeeklyTeamGroup[] {
  if (!employees || employees.length === 0) {
    return [];
  }

  // Group real employees by department
  const groups: { [key: string]: any[] } = {};
  employees.forEach((emp) => {
    const dept = emp.department ? emp.department.toUpperCase() : "GENERAL TEAM";
    const teamKey = dept.includes("TEAM") ? dept : `${dept} TEAM`;
    if (!groups[teamKey]) groups[teamKey] = [];
    groups[teamKey].push(emp);
  });

  return Object.keys(groups).map((teamName) => {
    const members: IWeeklyWorkerRow[] = groups[teamName].map((emp) => {
      const dailySalary = Number(emp.dailySalary) || 800;
      const dailyRecords: IWeeklyDailyRecord[] = days.map((d) => ({
        date: d.date,
        dayName: d.dayName,
        status: "P" as const,
        advance: 0,
      }));
      const totalWorkingDays = 6;
      const totalWeekSalary = totalWorkingDays * dailySalary;
      const totalAdvance = 0;
      const balance = totalWeekSalary;

      return {
        employeeId: emp.employeeId,
        employeeName: emp.name,
        role: emp.role || "Staff",
        dailySalary,
        dailyRecords,
        totalWorkingDays,
        totalWeekSalary,
        totalAdvance,
        balance,
      };
    });

    const totalTeamDays = members.reduce((sum, m) => sum + m.totalWorkingDays, 0);
    const totalTeamSalary = members.reduce((sum, m) => sum + m.totalWeekSalary, 0);
    const totalTeamAdvance = members.reduce((sum, m) => sum + m.totalAdvance, 0);
    const totalTeamBalance = members.reduce((sum, m) => sum + m.balance, 0);

    return {
      teamName,
      oldBalance: 0,
      extraExpenses: [],
      members,
      totalTeamDays,
      totalTeamSalary,
      totalTeamAdvance,
      totalTeamBalance,
      totalTeamExtraExpenses: 0,
      grandTotalPayable: totalTeamBalance,
    };
  });
}
