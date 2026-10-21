const nodemailer = require("nodemailer");

/**
 * Creates and returns a nodemailer transporter.
 * Supports Gmail app password via EMAIL_USER and EMAIL_PASS environment variables.
 */
const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass
      }
    });
  }

  // If specific SMTP host/port provided
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  return null;
};

/**
 * Sends a password reset verification code email.
 *
 * @param {string} toEmail - The recipient's email address
 * @param {string} code - The 6-digit OTP code
 * @param {string} recipientName - The user's name
 */
const sendResetCodeEmail = async (toEmail, code, recipientName = "Valued User") => {
  const transporter = createTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f1f5f9;
            margin: 0;
            padding: 24px;
            color: #0f172a;
          }
          .container {
            max-width: 540px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            padding: 36px 32px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
            border: 1px solid #e2e8f0;
          }
          .logo-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 24px;
          }
          .logo-icon {
            background: #2563eb;
            color: #ffffff;
            font-weight: 800;
            font-size: 18px;
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.02em;
          }
          h2 {
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 12px;
            color: #0f172a;
          }
          p {
            font-size: 15px;
            line-height: 1.6;
            color: #475569;
            margin: 0 0 20px;
          }
          .otp-box {
            background: #eff6ff;
            border: 2px dashed #93c5fd;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            margin: 28px 0;
          }
          .otp-code {
            font-family: 'Courier New', Courier, monospace;
            font-size: 34px;
            font-weight: 800;
            letter-spacing: 8px;
            color: #1d4ed8;
          }
          .otp-note {
            font-size: 13px;
            color: #64748b;
            margin-top: 8px;
          }
          .footer {
            margin-top: 32px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #94a3b8;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo-row">
            <div class="logo-icon">💰</div>
            <span class="brand-title">FinNest</span>
          </div>
          <h2>Password Reset Verification Code</h2>
          <p>Hello ${recipientName},</p>
          <p>We received a request to reset your password for your FinNest account. Use the 6-digit verification code below to complete your password reset:</p>
          <div class="otp-box">
            <div class="otp-code">${code}</div>
            <div class="otp-note">Valid for 10 minutes. Never share this code with anyone.</div>
          </div>
          <p>If you did not request a password reset, you can safely ignore this email — your account remains secure.</p>
          <div class="footer">
            &copy; 2026 FinNest Finance. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  if (transporter) {
    try {
      const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || "FinNest Security <noreply@finnest.com>";
      const info = await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject: `${code} is your FinNest verification code`,
        text: `Your FinNest password reset verification code is: ${code}. This code is valid for 10 minutes.`,
        html: htmlContent
      });
      console.log(`[FinNest Email] Verification code sent to ${toEmail}. MessageId: ${info.messageId}`);
      return { sent: true, method: "smtp" };
    } catch (error) {
      console.error(`[FinNest Email] Failed to send email via SMTP: ${error.message}`);
      console.log(`[FinNest Email Fallback] OTP for ${toEmail}: ${code}`);
      return { sent: false, error: error.message, devCode: code };
    }
  } else {
    // Development fallback when EMAIL_USER/EMAIL_PASS is not configured
    console.log(`\n======================================================`);
    console.log(`[FinNest Dev Email] No SMTP configured in .env.`);
    console.log(`[FinNest Dev Email] Sent verification code to: ${toEmail}`);
    console.log(`[FinNest Dev Email] >>> VERIFICATION CODE: ${code} <<<`);
    console.log(`======================================================\n`);
    return { sent: false, method: "dev_logged", devCode: code };
  }
};

module.exports = {
  sendResetCodeEmail
};
