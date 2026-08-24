import * as XLSX from "xlsx";

export interface TransactionExportItem {
  id: string;
  customerOrParty: string;
  type: "Customer Order" | "Truck Service" | "Material Cost";
  categoryOrService: string;
  date: string;
  totalAmount: number;
  dieselCost?: number;
  amountPaid: number;
  amountDue: number;
  paymentStatus: "Paid" | "Partial" | "Pending";
  notes?: string;
}

export function exportFinancialAnalyticsToExcel(
  transactions: TransactionExportItem[],
  fileName = `Elyon_Traders_Financial_Analytics_${new Date().toLocaleDateString("sv")}.xlsx`
) {
  // 1. Calculate Analytics Summaries
  const customerOrders = transactions.filter((t) => t.type === "Customer Order");
  const truckServices = transactions.filter((t) => t.type === "Truck Service");
  const materialExpenses = transactions.filter((t) => t.type === "Material Cost");

  const grossRevenue = customerOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalCustomerPaid = customerOrders.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const totalCustomerPendingDue = customerOrders.reduce((acc, curr) => acc + curr.amountDue, 0);

  const totalTruckFreight = truckServices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalTruckPaid = truckServices.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const totalTruckDue = truckServices.reduce((acc, curr) => acc + curr.amountDue, 0);

  const totalMaterialCosts = materialExpenses.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalMaterialPaid = materialExpenses.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const totalMaterialDue = materialExpenses.reduce((acc, curr) => acc + curr.amountDue, 0);

  const totalExpenses = totalTruckFreight + totalMaterialCosts;
  const netProfitCashFlow = grossRevenue - totalExpenses;

  // Sheet 1: Executive Financial Summary Sheet
  const summaryData = [
    { Metric: "COMPANY BRAND", Value: "ELYON TRADERS — THE MOST HIGH" },
    { Metric: "REPORT GENERATION DATE", Value: new Date().toLocaleString() },
    { Metric: "GSTIN NUMBER", Value: "33AAAAA0000A1Z5" },
    { Metric: "", Value: "" },
    { Metric: "--- REVENUE & CUSTOMER DUES ANALYTICS ---", Value: "" },
    { Metric: "Total Gross Revenue (Orders)", Value: `₹${grossRevenue.toLocaleString()}` },
    { Metric: "Total Received from Customers", Value: `₹${totalCustomerPaid.toLocaleString()}` },
    { Metric: "Total Money Need to Pay by Customer (Pending Dues)", Value: `₹${totalCustomerPendingDue.toLocaleString()}` },
    { Metric: "", Value: "" },
    { Metric: "--- TRUCK LOGISTICS FREIGHT ANALYTICS ---", Value: "" },
    { Metric: "Total Truck Services Charge", Value: `₹${totalTruckFreight.toLocaleString()}` },
    { Metric: "Total Paid for Truck Freight", Value: `₹${totalTruckPaid.toLocaleString()}` },
    { Metric: "Total Truck Freight Outstanding Balance", Value: `₹${totalTruckDue.toLocaleString()}` },
    { Metric: "", Value: "" },
    { Metric: "--- RAW MATERIAL EXPENSES ANALYTICS ---", Value: "" },
    { Metric: "Total Material Spend (Oil, Wood, Diesel)", Value: `₹${totalMaterialCosts.toLocaleString()}` },
    { Metric: "Total Paid for Materials", Value: `₹${totalMaterialPaid.toLocaleString()}` },
    { Metric: "Total Material Outstanding Balance", Value: `₹${totalMaterialDue.toLocaleString()}` },
    { Metric: "", Value: "" },
    { Metric: "--- NET CASH FLOW & PROFIT ---", Value: "" },
    { Metric: "Total Operational Expenses (Trucks + Materials)", Value: `₹${totalExpenses.toLocaleString()}` },
    { Metric: "Net Estimated Profit / Cash Flow", Value: `₹${netProfitCashFlow.toLocaleString()}` },
  ];

  // Sheet 2: Complete Itemized Transactions Ledger Sheet
  const ledgerRows = transactions.map((item) => ({
    "Transaction ID": item.id,
    "Customer / Party Name": item.customerOrParty,
    "Transaction Type": item.type,
    "Service / Category": item.categoryOrService,
    "Date (YYYY-MM-DD)": item.date,
    "Total Amount (₹)": item.totalAmount,
    "Diesel Price / Expense (₹)": item.dieselCost || 0,
    "Amount Paid (₹)": item.amountPaid,
    "Balance Due / Need to Pay (₹)": item.amountDue,
    "Payment Status": item.paymentStatus,
    "Notes & Remarks": item.notes || "",
  }));

  // Sheet 3: Customer Outstanding Dues (Money Need to Pay by Customer)
  const pendingCustomerDues = transactions
    .filter((t) => t.type === "Customer Order" && t.amountDue > 0)
    .map((item) => ({
      "Order ID": item.id,
      "Customer Name": item.customerOrParty,
      "Order Date": item.date,
      "Total Order Value (₹)": item.totalAmount,
      "Amount Paid (₹)": item.amountPaid,
      "Money Need to Pay (Outstanding Due ₹)": item.amountDue,
      "Payment Status": item.paymentStatus,
    }));

  // Create Workbook
  const workbook = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  const ledgerSheet = XLSX.utils.json_to_sheet(ledgerRows);
  const customerDuesSheet = XLSX.utils.json_to_sheet(pendingCustomerDues);

  // Set column widths
  summarySheet["!cols"] = [{ wch: 45 }, { wch: 35 }];
  ledgerSheet["!cols"] = [
    { wch: 15 },
    { wch: 30 },
    { wch: 18 },
    { wch: 25 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 25 },
    { wch: 15 },
    { wch: 35 },
  ];
  customerDuesSheet["!cols"] = [
    { wch: 15 },
    { wch: 30 },
    { wch: 15 },
    { wch: 20 },
    { wch: 18 },
    { wch: 30 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Financial Summary");
  XLSX.utils.book_append_sheet(workbook, ledgerSheet, "Transactions Ledger");
  XLSX.utils.book_append_sheet(workbook, customerDuesSheet, "Customer Pending Dues");

  // Export File
  XLSX.writeFile(workbook, fileName);
}

export interface DailyAttendanceExportReport {
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  dailySalary: number;
  advanceAmount: number;
  sessionStatus: { s1: boolean; s2: boolean; s3: boolean; s4: boolean };
  sessionsAttended: number;
  workCredit: number;
  dayStatus: string;
  earnedSalary: number;
  netPayable: number;
}

export function exportDailyAttendanceReportToExcel(
  date: string,
  summary: {
    totalEmployees: number;
    presentCount: number;
    fullDayCount: number;
    halfDayCount: number;
    absentCount: number;
    totalDailySalary: number;
    totalAdvance: number;
    totalNetPayable: number;
    overallPresenceRate: number;
  },
  reports: DailyAttendanceExportReport[],
  fileName = `Elyon_Traders_Daily_Attendance_Salary_Report_${date}.xlsx`
) {
  // 1. Executive Summary Sheet Data
  const summarySheetData = [
    { Metric: "COMPANY NAME", Value: "ELYON TRADERS — THE MOST HIGH" },
    { Metric: "ATTENDANCE REPORT DATE", Value: date },
    { Metric: "GENERATED AT", Value: new Date().toLocaleString() },
    { Metric: "", Value: "" },
    { Metric: "--- DAILY ATTENDANCE & PAYROLL SUMMARY ---", Value: "" },
    { Metric: "Total Active Staff Count", Value: summary.totalEmployees },
    { Metric: "Present Staff Count (Attended ≥1 Shift)", Value: summary.presentCount },
    { Metric: "Full Day Staff (4/4 Shifts)", Value: summary.fullDayCount },
    { Metric: "Half Day Staff (2/4 Shifts)", Value: summary.halfDayCount },
    { Metric: "Absent Staff (0/4 Shifts)", Value: summary.absentCount },
    { Metric: "Overall Presence Rate", Value: `${summary.overallPresenceRate}%` },
    { Metric: "", Value: "" },
    { Metric: "--- FINANCIAL & WAGES SUMMARY (₹) ---", Value: "" },
    { Metric: "Total Daily Earned Wages", Value: `₹${summary.totalDailySalary.toLocaleString()}` },
    { Metric: "Total Daily Advance Deductions", Value: `₹${summary.totalAdvance.toLocaleString()}` },
    { Metric: "Total Net Payable Daily Wages", Value: `₹${summary.totalNetPayable.toLocaleString()}` },
  ];

  // 2. Detailed Employee Roster Rows
  const rosterRows = reports.map((r, index) => ({
    "S.No": index + 1,
    "Employee ID": r.employeeId,
    "Employee Name": r.employeeName,
    "Role": r.role,
    "Department": r.department,
    "Daily Rate (₹/day)": r.dailySalary,
    "Session 1 (08:00-10:30)": r.sessionStatus.s1 ? "PRESENT" : "ABSENT",
    "Session 2 (10:30-13:00)": r.sessionStatus.s2 ? "PRESENT" : "ABSENT",
    "Session 3 (14:00-16:30)": r.sessionStatus.s3 ? "PRESENT" : "ABSENT",
    "Session 4 (16:30-19:00)": r.sessionStatus.s4 ? "PRESENT" : "ABSENT",
    "Shifts Worked": `${r.sessionsAttended}/4`,
    "Work Credit (Days)": r.workCredit,
    "Day Status": r.dayStatus,
    "Earned Daily Wages (₹)": r.earnedSalary,
    "Advance Paid / Deducted (₹)": r.advanceAmount,
    "Net Payable Salary (₹)": r.netPayable,
  }));

  const workbook = XLSX.utils.book_new();
  const summarySheet = XLSX.utils.json_to_sheet(summarySheetData);
  const rosterSheet = XLSX.utils.json_to_sheet(rosterRows);

  summarySheet["!cols"] = [{ wch: 45 }, { wch: 35 }];
  rosterSheet["!cols"] = [
    { wch: 6 },
    { wch: 15 },
    { wch: 25 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
    { wch: 22 },
    { wch: 25 },
    { wch: 22 },
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Daily Summary");
  XLSX.utils.book_append_sheet(workbook, rosterSheet, "Employee Attendance & Wages");

  XLSX.writeFile(workbook, fileName);
}

export function exportWeeklyTeamRegisterToExcel(
  register: {
    startDate: string;
    endDate: string;
    monthName: string;
    year: number;
    teams: Array<{
      teamName: string;
      oldBalance?: number;
      extraExpenses?: Array<{ description: string; amount: number }>;
      members: Array<{
        employeeId: string;
        employeeName: string;
        role?: string;
        dailySalary: number;
        dailyRecords: Array<{ date: string; dayName: string; status: string; advance: number }>;
        totalWorkingDays: number;
        totalWeekSalary: number;
        totalAdvance: number;
        balance: number;
      }>;
      totalTeamDays: number;
      totalTeamSalary: number;
      totalTeamAdvance: number;
      totalTeamBalance: number;
      totalTeamExtraExpenses: number;
      grandTotalPayable: number;
    }>;
  },
  fileName?: string
) {
  const defaultFileName = `Elyon_Traders_Weekly_Team_Attendance_${register.startDate}_to_${register.endDate}.xlsx`;
  const workbook = XLSX.utils.book_new();

  // 1. Overall Summary Sheet
  const overallSummary = [
    { Field: "COMPANY", Value: "ELYON TRADERS — THE MOST HIGH" },
    { Field: "WEEKLY WAGE & ATTENDANCE REGISTER", Value: `${register.startDate} to ${register.endDate}` },
    { Field: "PERIOD", Value: `${register.monthName} ${register.year}` },
    { Field: "", Value: "" },
    { Field: "--- TEAMS BREAKDOWN ---", Value: "" },
  ];

  let enterpriseTotalSalary = 0;
  let enterpriseTotalAdvance = 0;
  let enterpriseTotalBalance = 0;
  let enterpriseTotalExpenses = 0;
  let enterpriseGrandTotal = 0;

  register.teams.forEach((t) => {
    enterpriseTotalSalary += t.totalTeamSalary;
    enterpriseTotalAdvance += t.totalTeamAdvance;
    enterpriseTotalBalance += t.totalTeamBalance;
    enterpriseTotalExpenses += t.totalTeamExtraExpenses || 0;
    enterpriseGrandTotal += t.grandTotalPayable;

    overallSummary.push({
      Field: `Team: ${t.teamName}`,
      Value: `Workers: ${t.members.length} | Days: ${t.totalTeamDays} | Wages: ₹${t.totalTeamSalary.toLocaleString()} | Advance: ₹${t.totalTeamAdvance.toLocaleString()} | Balance: ₹${t.totalTeamBalance.toLocaleString()} | Grand Total: ₹${t.grandTotalPayable.toLocaleString()}`,
    });
  });

  overallSummary.push(
    { Field: "", Value: "" },
    { Field: "--- ENTERPRISE GRAND TOTALS ---", Value: "" },
    { Field: "Total Week Wages Disbursed", Value: `₹${enterpriseTotalSalary.toLocaleString()}` },
    { Field: "Total Cash Advances Given", Value: `₹${enterpriseTotalAdvance.toLocaleString()}` },
    { Field: "Total Net Wages Balance", Value: `₹${enterpriseTotalBalance.toLocaleString()}` },
    { Field: "Total Extra Expenses (Machine/Cleaning)", Value: `₹${enterpriseTotalExpenses.toLocaleString()}` },
    { Field: "Grand Total Enterprise Payout", Value: `₹${enterpriseGrandTotal.toLocaleString()}` }
  );

  const summarySheet = XLSX.utils.json_to_sheet(overallSummary);
  summarySheet["!cols"] = [{ wch: 35 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Enterprise Summary");

  // 2. Individual Team Sheets
  register.teams.forEach((team) => {
    const rows: any[] = [];

    team.members.forEach((m, idx) => {
      const row: any = {
        "S.No": idx + 1,
        "Worker Name": m.employeeName,
        "ID": m.employeeId,
        "Role": m.role || "Staff",
      };

      m.dailyRecords.forEach((dr) => {
        const shortDay = dr.dayName.substring(0, 3);
        const dayLabel = `${shortDay} (${dr.date.split("-").slice(1).join("/")})`;
        row[`${dayLabel} Status`] = dr.status || "-";
        row[`${dayLabel} Adv (₹)`] = dr.advance > 0 ? dr.advance : 0;
      });

      row["Total Working Days"] = m.totalWorkingDays;
      row["Daily Salary (₹)"] = m.dailySalary;
      row["Total Week Salary (₹)"] = m.totalWeekSalary;
      row["Total Advance (₹)"] = m.totalAdvance;
      row["Net Balance (₹)"] = m.balance;

      rows.push(row);
    });

    // Append Team Totals Row
    const totalRow: any = {
      "S.No": "TOTAL",
      "Worker Name": `${team.teamName} SUMMARY`,
      "ID": "",
      "Role": "",
    };
    if (team.members.length > 0 && team.members[0].dailyRecords) {
      team.members[0].dailyRecords.forEach((dr) => {
        const shortDay = dr.dayName.substring(0, 3);
        const dayLabel = `${shortDay} (${dr.date.split("-").slice(1).join("/")})`;
        totalRow[`${dayLabel} Status`] = "";
        totalRow[`${dayLabel} Adv (₹)`] = team.members.reduce((acc, mem) => {
          const rec = mem.dailyRecords.find((r) => r.date === dr.date);
          return acc + (rec?.advance || 0);
        }, 0);
      });
    }

    totalRow["Total Working Days"] = team.totalTeamDays;
    totalRow["Daily Salary (₹)"] = "-";
    totalRow["Total Week Salary (₹)"] = team.totalTeamSalary;
    totalRow["Total Advance (₹)"] = team.totalTeamAdvance;
    totalRow["Net Balance (₹)"] = team.totalTeamBalance;
    rows.push(totalRow);

    // Extra rows if team has extra expenses or old balance
    if (team.oldBalance) {
      rows.push({
        "S.No": "",
        "Worker Name": "OLD BALANCE CARRYOVER",
        "Net Balance (₹)": team.oldBalance,
      });
    }
    if (team.extraExpenses && team.extraExpenses.length > 0) {
      team.extraExpenses.forEach((ex) => {
        rows.push({
          "S.No": "",
          "Worker Name": `EXTRA: ${ex.description}`,
          "Net Balance (₹)": ex.amount,
        });
      });
    }
    rows.push({
      "S.No": "FINAL",
      "Worker Name": `GRAND TOTAL PAYABLE (${team.teamName})`,
      "Net Balance (₹)": team.grandTotalPayable,
    });

    const teamSheet = XLSX.utils.json_to_sheet(rows);
    const sheetName = team.teamName.replace(/[\\/*?:[\]]/g, "").substring(0, 30);
    XLSX.utils.book_append_sheet(workbook, teamSheet, sheetName);
  });

  XLSX.writeFile(workbook, fileName || defaultFileName);
}


