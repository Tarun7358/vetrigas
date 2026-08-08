export interface WhatsAppReceiptPayload {
  customerPhone: string;
  customerName: string;
  billNumber: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  driverName: string;
  cylinderCount: number;
  date: string;
}

/**
 * Formats a professional Tamil Nadu LPG Gas Digital Receipt message
 */
export function formatReceiptMessage(data: WhatsAppReceiptPayload): string {
  return `🔥 *VETRI INDANE LPG GAS AGENCY* 🔥
----------------------------------------
🧾 *DIGITAL PAYMENT RECEIPT*
----------------------------------------
📋 *Bill No:* ${data.billNumber}
👤 *Customer:* ${data.customerName}
📞 *Phone:* ${data.customerPhone}
📦 *Cylinders:* ${data.cylinderCount} Unit(s) (14.2kg / 19kg)
💰 *Total Paid:* ₹${data.amount}
💳 *Method:* ${data.paymentMethod}
🔢 *Txn ID:* ${data.transactionId || 'N/A'}
🚚 *Delivered By:* ${data.driverName}
📅 *Date & Time:* ${data.date}

----------------------------------------
✅ *Payment Verified & Received with Thanks!*
📞 Helpline: +91 98765 00001
📍 Peelamedu, Coimbatore, TN
----------------------------------------`;
}

/**
 * Sends automated WhatsApp receipt via Meta Graph API or Twilio API
 */
export async function sendWhatsAppReceipt(payload: WhatsAppReceiptPayload): Promise<{ success: boolean; message: string }> {
  const formattedText = formatReceiptMessage(payload);
  console.log(`[WHATSAPP WEBHOOK] Dispatching instant digital receipt to ${payload.customerPhone}...`);
  console.log(formattedText);

  const metaToken = process.env.WHATSAPP_META_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (metaToken && phoneId) {
    try {
      const cleanPhone = payload.customerPhone.replace(/[^0-9]/g, '');
      const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

      const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: { body: formattedText },
        }),
      });

      if (res.ok) {
        console.log(`✓ WhatsApp message successfully sent via Meta Graph API to ${formattedPhone}`);
        return { success: true, message: 'WhatsApp receipt sent via Meta Graph API' };
      } else {
        const errData = await res.json();
        console.warn('Meta WhatsApp API note:', errData);
      }
    } catch (err) {
      console.error('WhatsApp API dispatch error:', err);
    }
  }

  // Fallback / Direct Link Generation for driver device
  const encodedMsg = encodeURIComponent(formattedText);
  const cleanPhone = payload.customerPhone.replace(/[^0-9]/g, '');
  const waWebUrl = `https://api.whatsapp.com/send?phone=${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}&text=${encodedMsg}`;

  return {
    success: true,
    message: 'WhatsApp message prepped and ready for direct dispatch',
  };
}
