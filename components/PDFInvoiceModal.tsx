"use client";

import { useRef } from "react";
import { X, Download, ShieldCheck, CheckCircle2, Clock } from "lucide-react";
import TransparentLogo from "./TransparentLogo";
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
  items: Array<{
    description: string;
    hsnCode: string;
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
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  // Calculate Tax details (assuming 18% GST = 9% CGST + 9% SGST)
  const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const grandTotal = subtotal + cgst + sgst;
  const amountDue = Math.max(0, grandTotal - invoice.amountPaid);

  const handleDownload = async () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const filename = `Invoice_${invoice.invoiceNo.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;
    await downloadElementAsPDF(printContent, filename);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="glass-panel w-full max-w-3xl p-6 sm:p-8 rounded-3xl border-amber-500/40 relative shadow-2xl bg-white dark:bg-[#0D0B10] text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Action Controls */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4 mb-6">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold">
              Official GST Tax Invoice
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-amber-600/20 flex items-center space-x-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Invoice</span>
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
        <div ref={printRef} className="p-4 sm:p-6 bg-white dark:bg-[#0D0B10] rounded-2xl">
          {/* Header */}
          <table className="w-full mb-6 border-b-2 border-amber-600/40 pb-4">
            <tbody>
              <tr>
                <td className="align-top">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-12 h-12 flex items-center justify-center">
                      <TransparentLogo src="/elyon-logo.jpeg" alt="Elyon Traders Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-serif font-bold text-amber-900 dark:text-amber-100 tracking-wider">
                        ELYON TRADERS
                      </h1>
                      <p className="text-[10px] font-serif tracking-[0.3em] text-amber-700 dark:text-amber-300 font-semibold uppercase">
                        THE MOST HIGH
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Official Enterprise Operations & Transport Freight Logistics<br />
                    Phone: +91 9566957474 | Email: elyontraderss@gmail.com
                  </p>
                </td>
                <td className="align-top text-right">
                  <div className="inline-block px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 font-mono font-bold text-xs mb-2">
                    GSTIN: 33AAAAA0000A1Z5
                  </div>
                  <h2 className="text-xl font-serif font-bold text-slate-800 dark:text-slate-200 uppercase">
                    TAX INVOICE
                  </h2>
                  <p className="text-xs font-mono font-semibold text-amber-700 dark:text-amber-300">
                    No: {invoice.invoiceNo}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">Date: {invoice.date}</p>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Customer / Bill To Details */}
          <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 mb-6 text-xs">
            <div>
              <span className="font-serif font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider block mb-1">
                Billed To (Customer):
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{invoice.customerName}</p>
              {(invoice.customerPhone || invoice.customerEmail) && (
                <p className="text-slate-600 dark:text-slate-400 font-mono">
                  Mobile: {invoice.customerPhone || invoice.customerEmail}
                </p>
              )}
              <p className="text-slate-500 mt-1">Service Type: {invoice.type}</p>
            </div>

            <div className="text-right">
              <span className="font-serif font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider block mb-1">
                Payment Info:
              </span>
              <span
                className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                  invoice.paymentStatus === "Paid"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : invoice.paymentStatus === "Partial"
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                }`}
              >
                {invoice.paymentStatus === "Paid" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                <span>{invoice.paymentStatus}</span>
              </span>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-left text-xs mb-6 border-collapse">
            <thead>
              <tr className="bg-amber-500/10 text-amber-900 dark:text-amber-200 font-serif font-bold border-b border-amber-500/20">
                <th className="p-3">#</th>
                <th className="p-3">Service / Product Description</th>
                <th className="p-3">HSN/SAC</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-right">Rate (₹)</th>
                <th className="p-3 text-right">Taxable Value (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-3 font-mono">{idx + 1}</td>
                  <td className="p-3 font-semibold">{item.description}</td>
                  <td className="p-3 font-mono text-slate-500">{item.hsnCode}</td>
                  <td className="p-3 text-right font-mono">{item.quantity}</td>
                  <td className="p-3 text-right font-mono">₹{item.unitPrice.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-bold">
                    ₹{(item.quantity * item.unitPrice).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary Box & Due Amount */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pt-2">
            <div className="text-xs space-y-1 max-w-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">Terms & Conditions:</span>
              <p className="text-slate-500 leading-relaxed">
                1. Payment due upon delivery or contract terms.<br />
                2. Goods/services supplied under Elyon Traders standard business compliance.
              </p>
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-amber-900 dark:text-amber-200 font-bold bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                <span>Diesel Price / Freight Expense:</span>
                <span className="text-amber-700 dark:text-amber-300">₹{(invoice.dieselCost || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>CGST (9%):</span>
                <span>₹{cgst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>SGST (9%):</span>
                <span>₹{sgst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-amber-100 border-t border-b border-amber-500/30 py-2">
                <span>Grand Total (incl. GST):</span>
                <span className="text-amber-700 dark:text-amber-300">₹{grandTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Amount Paid by Customer:</span>
                <span>₹{invoice.amountPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold text-sm bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
                <span>Money Need to Pay (Balance Due):</span>
                <span>₹{amountDue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="mt-12 text-right pt-6 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-serif font-bold tracking-wider text-amber-800 dark:text-amber-300 block">
              For ELYON TRADERS
            </span>
            <div className="h-12"></div>
            <span className="text-[11px] text-slate-500 block">Authorized Signatory</span>
          </div>
        </div>
      </div>
    </div>
  );
}
