import * as XLSX from "xlsx";

export interface TransactionExportItem {
  id: string;
  customerOrParty: string;
  type: "Customer Order" | "Truck Service" | "Material Cost";
  categoryOrService: string;
  date: string;
  totalAmount: number;
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
