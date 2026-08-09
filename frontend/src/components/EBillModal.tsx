import React from 'react';
import type { BillRecord } from '../types';
import { X, Printer, Share2, Download, CheckCircle2, QrCode } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface EBillModalProps {
  bill: BillRecord | null;
  onClose: () => void;
}

export const EBillModal: React.FC<EBillModalProps> = ({ bill, onClose }) => {
  if (!bill) return null;

  const handleDownloadPDF = async () => {
    const element = document.getElementById('ebill-invoice-card');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`VetriIndane_EBill_${bill.billNumber}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF invoice.');
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Vetri Indane E-Bill Invoice: ${bill.billNumber}\nCustomer: ${bill.customerName}\nAmount Paid: ₹${bill.amount}\nTxn ID: ${bill.transactionId}\nDate: ${bill.date}\nThank you for choosing Vetri Indane!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-white animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <span className="badge-status badge-amber text-[10px]">DIGITAL RECEIPT</span>
            <span className="font-mono text-xs text-slate-300 font-semibold">{bill.billNumber}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Invoice Card */}
        <div className="p-6 overflow-y-auto bg-slate-950" id="ebill-invoice-card">
          <div className="border border-slate-800 rounded-xl p-6 bg-slate-900 space-y-6">
            {/* Branding Header */}
            <div className="text-center border-b border-slate-800 pb-4 space-y-1">
              <h2 className="font-display font-extrabold text-2xl tracking-tight text-white">
                VETRI INDANE
              </h2>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                LPG Gas Distribution • Coimbatore
              </p>
              <p className="text-[11px] text-slate-400">Powered by RDK Technologies Platform</p>
            </div>

            {/* Invoice Meta Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 text-[11px]">Customer Name</p>
                <p className="font-bold text-white text-sm mt-0.5">{bill.customerName}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-[11px]">Invoice Date</p>
                <p className="font-mono text-slate-200 mt-0.5">{bill.date}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[11px]">Delivered By (Driver)</p>
                <p className="font-semibold text-slate-200 mt-0.5">{bill.driverName}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-[11px]">Payment Method</p>
                <span className="badge-status badge-blue mt-0.5">{bill.paymentMethod}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-800 rounded-lg overflow-hidden text-xs">
              <div className="bg-slate-950 p-2.5 font-bold text-slate-400 grid grid-cols-4 border-b border-slate-800">
                <span className="col-span-2">Item Description</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Total</span>
              </div>
              <div className="p-3 grid grid-cols-4 items-center font-medium text-slate-200">
                <span className="col-span-2 font-bold text-white">
                  Commercial/Domestic LPG Cylinder (14.2kg)
                </span>
                <span className="text-center font-mono font-bold">{bill.cylinderCount}</span>
                <span className="text-right font-mono font-extrabold text-amber-400">
                  ₹{bill.amount}
                </span>
              </div>
            </div>

            {/* Payment Summary Box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono">₹{bill.amount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST (Incl. 5%)</span>
                <span className="font-mono">₹{(bill.amount * 0.05).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Delivery Charge</span>
                <span className="font-mono text-emerald-400">FREE</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center font-bold text-sm">
                <span className="text-white">Total Paid</span>
                <span className="font-display font-extrabold text-lg text-emerald-400 font-mono">
                  ₹{bill.amount}
                </span>
              </div>
            </div>

            {/* Status Footer + Live Google Pay UPI QR */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> PAYMENT CONFIRMED
                </div>
                <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                  <QrCode className="w-3.5 h-3.5 text-slate-400" /> {bill.transactionId}
                </div>
                <p className="text-[10px] text-slate-500 font-mono">GPay / UPI: 9600870814@upi (+91 96008 70814)</p>
              </div>

              <div className="bg-white p-2 rounded-xl border border-slate-200 text-center shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    `upi://pay?pa=9600870814@upi&pn=VETRI%20INDANE%20LPG&am=${bill.amount}&cu=INR&tn=Bill-${bill.billNumber}`
                  )}`}
                  alt="Google Pay UPI QR Code"
                  className="w-20 h-20 mx-auto"
                />
                <span className="text-[9px] font-mono font-extrabold text-slate-800 block mt-0.5">SCAN TO PAY (GPAY)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3">
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Share2 className="w-4 h-4" /> WhatsApp E-Bill
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
          <button
            onClick={() => window.print()}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
            title="Print Receipt"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
