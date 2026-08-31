"use client";

import { useRef, useState } from "react";
import { X, Download, FileText, Receipt, CheckCircle2, Clock } from "lucide-react";
import { downloadElementAsPDF } from "@/lib/pdfGenerator";

export interface InvoiceData {
  invoiceNo: string;
  date: string;
  type: "Customer Order" | "Truck Service" | "Material Cost";
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerGstin?: string;
  vehicleNo?: string;
  items: Array<{
    description: string;
    hsnCode?: string;
    quantity: number;
    unitPrice: number;
  }>;
  dieselCost?: number; // Diesel price / Freight expense
  amountPaid: number;
  paymentStatus: "Paid" | "Partial" | "Pending";
  notes?: string;
}

interface PDFInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceData | null;
}

export default function PDFInvoiceModal({ isOpen, onClose, invoice }: PDFInvoiceModalProps) {
  const [billStyle, setBillStyle] = useState<"CASH_BILL" | "TAX_INVOICE">("CASH_BILL");
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  // Calculate Tax details for Bricks: 5% Total GST (2.5% CGST + 2.5% SGST)
  const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const cgst = Number((subtotal * 0.025).toFixed(2));
  const sgst = Number((subtotal * 0.025).toFixed(2));
  const grandTotal = subtotal + cgst + sgst;
  const amountDue = Math.max(0, grandTotal - invoice.amountPaid);

  const handleDownload = async () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const prefix = billStyle === "CASH_BILL" ? "Elyon_Traders_CashBill" : "Elyon_Traders_TaxInvoice";
    const filename = `${prefix}_${invoice.invoiceNo.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;
    await downloadElementAsPDF(printContent, filename);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="glass-panel w-full max-w-3xl p-6 sm:p-8 rounded-3xl border-amber-500/40 relative shadow-2xl bg-white dark:bg-[#0D0B10] text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between border-b border-amber-500/20 pb-4 mb-6 gap-3">
          {/* Format Switcher */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setBillStyle("CASH_BILL")}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                billStyle === "CASH_BILL"
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Elyon Cash Bill (Paper Slip)</span>
            </button>

            <button
              onClick={() => setBillStyle("TAX_INVOICE")}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                billStyle === "TAX_INVOICE"
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Elyon Detailed Tax Invoice</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-amber-600/20 flex items-center space-x-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Bill</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div ref={printRef} className="p-4 sm:p-6 bg-white text-slate-900 rounded-2xl font-sans">
          {billStyle === "CASH_BILL" ? (
            /* EXACT ELYON TRADERS CASH BILL FORMAT */
            <div className="border-2 border-blue-900 rounded-xl p-6 bg-white text-blue-950 space-y-4 max-w-2xl mx-auto shadow-sm">
              {/* Header Info */}
              <div className="flex justify-between items-start text-[11px] font-semibold border-b border-blue-200 pb-2">
                <div>
                  <span>GST.No. : </span>
                  <span className="font-mono font-bold tracking-wider text-blue-900">33AGVPG0116E2ZT</span>
                </div>
                <div className="text-center font-bold uppercase tracking-widest text-xs px-3 py-0.5 bg-blue-50 border border-blue-300 rounded">
                  CASH BILL
                </div>
                <div className="text-right font-mono text-[10px] leading-tight text-blue-900">
                  <div>Cell: 9843242868</div>
                  <div>8760025000</div>
                  <div>9659689048</div>
                </div>
              </div>

              {/* Title & Address */}
              <div className="text-center space-y-0.5 py-1">
                <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wider text-blue-900 uppercase">
                  ELYON TRADERS
                </h1>
                <p className="text-[10px] font-serif font-bold tracking-[0.25em] text-amber-700 uppercase">
                  THE MOST HIGH
                </p>
                <p className="text-[11px] font-medium text-slate-700">
                  5/1A, Kanagamoolamkudieruppu, Thazhakudy Post, K.K.Dist - 629 901.
                </p>
              </div>

              {/* Bill Details Bar */}
              <div className="grid grid-cols-2 gap-4 border-t border-b border-blue-300 py-2.5 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-blue-950">Bill No:</span>
                  <span className="font-mono font-bold text-red-600 text-sm">{invoice.invoiceNo.replace(/[^0-9]/g, "") || "715"}</span>
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <span className="font-bold text-blue-950">Date:</span>
                  <span className="font-mono font-semibold">{invoice.date}</span>
                </div>
                <div className="col-span-2 space-y-1">
                  <div className="flex items-start space-x-2 border-b border-dotted border-blue-300 pb-1">
                    <span className="font-bold text-blue-950 shrink-0">To:</span>
                    <span className="font-bold text-sm text-blue-950 uppercase">{invoice.customerName}</span>
                  </div>
                  {(invoice.customerPhone || invoice.customerEmail) && (
                    <div className="flex items-center space-x-2 pt-0.5">
                      <span className="font-bold text-blue-950 shrink-0">Mob:</span>
                      <span className="font-mono font-bold">{invoice.customerPhone || invoice.customerEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cash Bill Table */}
              <table className="w-full text-xs border-collapse border border-blue-900">
                <thead>
                  <tr className="bg-blue-900 text-white font-bold border-b border-blue-900 text-center">
                    <th className="p-2 border border-blue-800 w-12">Sl.No.</th>
                    <th className="p-2 border border-blue-800 text-left">Particulars</th>
                    <th className="p-2 border border-blue-800 w-16">Qty.</th>
                    <th className="p-2 border border-blue-800 w-16">Rate</th>
                    <th className="p-2 border border-blue-800 w-28 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-200">
                  {/* Items / Bricks Row */}
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="font-semibold text-blue-950">
                      <td className="p-2.5 text-center font-mono border border-blue-200">{idx + 1}</td>
                      <td className="p-2.5 border border-blue-200">
                        <span className="font-bold uppercase">
                          {invoice.vehicleNo ? `${invoice.vehicleNo} ` : ""}
                          {item.description || "Bricks Supply"}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold border border-blue-200">{item.quantity}</td>
                      <td className="p-2.5 text-center font-mono font-bold border border-blue-200">{item.unitPrice}</td>
                      <td className="p-2.5 text-right font-mono font-bold border border-blue-200">
                        {(item.quantity * item.unitPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}

                  {/* CGST 2.5% Row */}
                  <tr className="font-semibold text-blue-950">
                    <td className="p-2 text-center font-mono border border-blue-200"></td>
                    <td className="p-2 border border-blue-200 font-bold tracking-wider">C.G.S.T</td>
                    <td className="p-2 text-center font-mono border border-blue-200 text-[11px]">2.5%</td>
                    <td className="p-2 text-center font-mono border border-blue-200"></td>
                    <td className="p-2 text-right font-mono font-bold border border-blue-200">{cgst.toFixed(2)}</td>
                  </tr>

                  {/* SGST 2.5% Row */}
                  <tr className="font-semibold text-blue-950">
                    <td className="p-2 text-center font-mono border border-blue-200"></td>
                    <td className="p-2 border border-blue-200 font-bold tracking-wider">S.G.S.T</td>
                    <td className="p-2 text-center font-mono border border-blue-200 text-[11px]">2.5%</td>
                    <td className="p-2 text-center font-mono border border-blue-200"></td>
                    <td className="p-2 text-right font-mono font-bold border border-blue-200">{sgst.toFixed(2)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-blue-50 font-bold text-blue-950 border-t-2 border-blue-900">
                    <td colSpan={4} className="p-2.5 text-right uppercase tracking-wider text-xs border border-blue-300">
                      TOTAL
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-sm border border-blue-300 text-blue-950">
                      ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Signature Footer */}
              <div className="pt-8 flex justify-between items-end text-xs">
                <div className="text-slate-500 font-mono text-[10px]">
                  Thank you for your business!
                </div>
                <div className="text-right space-y-8">
                  <span className="font-serif font-bold text-blue-900 tracking-wider block">
                    For ELYON TRADERS
                  </span>
                  <span className="border-t border-blue-300 pt-1 block text-[11px] text-slate-500">
                    Authorized Signatory
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* DETAILED TAX INVOICE FORMAT */
            <div className="space-y-6">
              <table className="w-full border-b-2 border-amber-600/40 pb-4">
                <tbody>
                  <tr>
                    <td className="align-top">
                      <h1 className="text-2xl font-serif font-bold text-amber-900 tracking-wider">
                        ELYON TRADERS
                      </h1>
                      <p className="text-[10px] font-serif font-bold tracking-[0.25em] text-amber-700 uppercase mb-1">
                        THE MOST HIGH
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        5/1A, Kanagamoolamkudieruppu, Thazhakudy Post, K.K.Dist - 629 901.<br />
                        Phone: 9843242868 | 8760025000 | 9659689048
                      </p>
                    </td>
                    <td className="align-top text-right">
                      <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-900 font-mono font-bold text-xs mb-1">
                        GSTIN: 33AGVPG0116E2ZT
                      </div>
                      <h2 className="text-lg font-serif font-bold uppercase">TAX INVOICE</h2>
                      <p className="text-xs font-mono font-semibold text-amber-700">No: {invoice.invoiceNo}</p>
                      <p className="text-xs text-slate-500 font-mono">Date: {invoice.date}</p>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs">
                <div>
                  <span className="font-bold text-amber-900 uppercase block mb-0.5">Billed To:</span>
                  <p className="font-bold text-sm">{invoice.customerName}</p>
                  <p className="text-slate-600 font-mono">Mobile: {invoice.customerPhone || invoice.customerEmail || "-"}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-900 uppercase block mb-0.5">Payment Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                    {invoice.paymentStatus}
                  </span>
                </div>
              </div>

              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-amber-500/10 text-amber-900 font-bold border-b border-amber-500/20">
                    <th className="p-2.5 text-left">#</th>
                    <th className="p-2.5 text-left">Description</th>
                    <th className="p-2.5 text-right">Qty</th>
                    <th className="p-2.5 text-right">Rate (₹)</th>
                    <th className="p-2.5 text-right">Taxable Value (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-mono">{idx + 1}</td>
                      <td className="p-2.5 font-semibold">{item.description}</td>
                      <td className="p-2.5 text-right font-mono">{item.quantity}</td>
                      <td className="p-2.5 text-right font-mono">₹{item.unitPrice.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono font-bold">₹{(item.quantity * item.unitPrice).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (2.5%):</span>
                    <span>₹{cgst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST (2.5%):</span>
                    <span>₹{sgst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-b border-amber-500/30 py-1.5">
                    <span>Grand Total:</span>
                    <span className="text-amber-700">₹{grandTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Amount Paid:</span>
                    <span>₹{invoice.amountPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-amber-600 font-bold bg-amber-500/10 p-2 rounded-lg">
                    <span>Balance Due:</span>
                    <span>₹{amountDue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 text-right border-t border-slate-200">
                <span className="text-xs font-serif font-bold text-amber-800 block">For ELYON TRADERS</span>
                <span className="text-[11px] text-slate-500">Authorized Signatory</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


