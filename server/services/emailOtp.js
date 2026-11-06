const nodemailer = require('nodemailer');

// Active OTP store in memory: email -> { otp: string, expiresAt: number, metadata: object }
const emailOtpStore = new Map();

/**
 * Configure email transporter
 * Supports custom SMTP from environment variables (e.g. Gmail, Brevo, SendGrid, Resend)
 * If none provided, logs OTP to terminal with simulated delivery guarantee
 */
function createTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return null;
}

/**
 * Generate a 6-digit numeric OTP
 */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send 6-digit Email OTP to recipient
 */
async function sendEmailOtpCode(email, metadata = {}) {
  const cleanEmail = email.trim().toLowerCase();
  const otp = generateOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes TTL

  emailOtpStore.set(cleanEmail, {
    otp,
    expiresAt,
    metadata
  });

  console.log(`\n==================================================`);
  console.log(`🔑 [PRAVASA AI EMAIL OTP DELIVERY]`);
  console.log(`📧 Recipient: ${cleanEmail}`);
  console.log(`🔢 6-DIGIT OTP CODE: [ ${otp} ]`);
  console.log(`⏰ Valid for: 10 minutes`);
  console.log(`==================================================\n`);

  const transporter = createTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Pravasa AI" <${process.env.SMTP_USER}>`,
        to: cleanEmail,
        subject: `Your Pravasa AI Verification OTP: ${otp}`,
        text: `Your Pravasa AI login verification OTP is: ${otp}. It will expire in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #00473F; margin: 0;">Pravasa AI</h2>
              <p style="color: #64748b; font-size: 14px; margin: 4px 0 0;">Karnataka Smart Travel & Tourism Intelligence</p>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; text-align: center;">
              <p style="font-size: 14px; color: #166534; margin: 0 0 10px;">Your 6-Digit Email Verification Code</p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #00473F; padding: 12px; background: #ffffff; border-radius: 6px; display: inline-block;">
                ${otp}
              </div>
              <p style="font-size: 12px; color: #475569; margin: 12px 0 0;">Valid for 10 minutes. Never share this code with anyone.</p>
            </div>
          </div>
        `
      });
      return { sent: true, method: 'smtp' };
    } catch (err) {
      console.warn(`[SMTP Warning] Could not send via external SMTP: ${err.message}. Terminal code displayed above.`);
    }
  }

  return { sent: true, method: 'terminal', otp };
}

/**
 * Verify 6-digit Email OTP
 */
function verifyEmailOtpCode(email, enteredOtp) {
  const cleanEmail = email.trim().toLowerCase();
  const record = emailOtpStore.get(cleanEmail);

  if (!record) {
    return { valid: false, error: 'No OTP requested for this email. Please request an OTP first.' };
  }

  if (Date.now() > record.expiresAt) {
    emailOtpStore.delete(cleanEmail);
    return { valid: false, error: 'OTP has expired. Please request a new code.' };
  }

  if (record.otp !== enteredOtp.trim()) {
    return { valid: false, error: 'Incorrect 6-digit OTP code. Please try again.' };
  }

  // OTP verified successfully; clear it
  const metadata = record.metadata || {};
  emailOtpStore.delete(cleanEmail);

  return { valid: true, metadata };
}

module.exports = {
  sendEmailOtpCode,
  verifyEmailOtpCode
};

