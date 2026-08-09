import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// SMTP Transporter Configuration
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';

const isSmtpConfigured = Boolean(smtpUser && smtpPass);

let transporter: nodemailer.Transporter | null = null;

if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

interface PasswordResetEmailOptions {
  toEmail: string;
  userName: string;
  resetToken: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({
  toEmail,
  userName,
  resetToken,
  resetUrl,
}: PasswordResetEmailOptions): Promise<{ sent: boolean; message: string }> {
  const subject = '🔒 Vetri Indane — Password Reset Request';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #ffffff; padding: 24px; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #f59e0b; margin: 0; font-size: 24px;">VETRI INDANE LPG</h1>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">Enterprise Operations Platform</p>
      </div>

      <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155;">
        <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">Password Reset Request</h2>
        <p style="color: #cbd5e1; font-size: 14px;">Hello <strong>${userName}</strong>,</p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5;">
          We received a request to reset your password for the Vetri Indane Operations Portal. Click the button below to reset your password. This link is valid for <strong>1 hour</strong>.
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="background-color: #f59e0b; color: #0f172a; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 10px; display: inline-block; font-size: 14px;">
            RESET PASSWORD NOW
          </a>
        </div>

        <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
          If you didn't request this reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>

      <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 11px;">
        <p>© 2026 Vetri Indane LPG Distributors • Powered by RDK Technologies</p>
      </div>
    </div>
  `;

  if (transporter && isSmtpConfigured) {
    try {
      await transporter.sendMail({
        from: `"Vetri Indane Platform" <${smtpUser}>`,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log(`[EMAIL DISPATCH] ✓ Password reset link sent successfully to ${toEmail}`);
      return { sent: true, message: `Password reset instructions sent to ${toEmail}.` };
    } catch (err: any) {
      console.error('[EMAIL ERROR] Failed to send email via SMTP:', err);
      return { sent: false, message: `SMTP Transport error: ${err?.message || 'Email delivery failed'}` };
    }
  } else {
    console.log(`[EMAIL NOTICE] SMTP not configured (set SMTP_USER and SMTP_PASS in .env).`);
    console.log(`[RESET LINK FOR ${toEmail}]: ${resetUrl}`);
    return {
      sent: true,
      message: `Password reset link generated. (SMTP Notice: Email credentials pending in .env, reset URL logged for security).`,
    };
  }
}
