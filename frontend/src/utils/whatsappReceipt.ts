/**
 * WhatsApp Digital Receipt Generator for Vetri Indane LPG Distribution
 * Formats official customer receipts and opens WhatsApp with pre-filled message text.
 */

export interface ReceiptDetails {
  customerName: string;
  customerPhone: string;
  billNumber: string;
  cylinderCount: number;
  amount: number;
  paymentMethod: 'UPI' | 'CASH' | string;
  transactionId?: string;
  driverName?: string;
  vehicleNumber?: string;
  date?: string;
}

export function sendWhatsAppReceipt(details: ReceiptDetails): void {
  const cleanPhone = details.customerPhone.replace(/\D/g, '');
  // Default to India country code 91 if 10 digits
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const dateStr = details.date || new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const message = `
🧾 *VETRI INDANE LPG DISTRIBUTORSHIP*
*Official Customer Delivery & Payment Receipt*
---------------------------------------
*Customer:* ${details.customerName}
*Bill / Memo No:* ${details.billNumber}
*Cylinders:* ${details.cylinderCount} x 14.2kg Refill
*Total Paid:* ₹${details.amount.toLocaleString()} (${details.paymentMethod.toUpperCase()})
${details.transactionId ? `*Transaction ID:* ${details.transactionId}\n` : ''}*Delivery Agent:* ${details.driverName || 'Vetri Delivery Team'} ${details.vehicleNumber ? `(${details.vehicleNumber})` : ''}
*Date & Time:* ${dateStr}
---------------------------------------
*SAP Code:* IN0039201 | Coimbatore South Circle
*Support Helpline:* +91 98765 00001

_Thank you for choosing Vetri Indane! Safe cooking with LPG._
`.trim();

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;

  // Open WhatsApp in a new tab / app window
  window.open(whatsappUrl, '_blank');
}
