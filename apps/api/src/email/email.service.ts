import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendVerificationCode(
    to: string,
    code: string,
    fullName?: string | null,
  ): Promise<void> {
    const name = fullName || "there";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 40px; }
          .container { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
          .title { font-size: 22px; font-weight: 700; color: #111; margin-bottom: 8px; }
          .subtitle { font-size: 14px; color: #666; margin-bottom: 24px; }
          .code-box { background: #f0f7ff; border: 1px solid #d0e3ff; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0; }
          .code { font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #007AFF; }
          .note { font-size: 13px; color: #999; text-align: center; }
          .footer { margin-top: 32px; font-size: 12px; color: #bbb; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="title">Verify Your Email</div>
          <div class="subtitle">Hi ${name},</div>
          <div class="subtitle">
            Use the verification code below to confirm your email address
            and complete your Budget Tracker registration.
          </div>
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          <div class="note">This code expires in 10 minutes.</div>
          <div class="footer">
            If you didn't create an account, you can safely ignore this email.
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from:
          process.env.SMTP_FROM || "Budget Tracker <noreply@budgettracker.com>",
        to,
        subject: "Your Budget Tracker Verification Code",
        html,
      });
      this.logger.log(`Verification email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }

  async sendPasswordResetCode(
    to: string,
    code: string,
    fullName?: string | null,
  ): Promise<void> {
    const name = fullName || "there";

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 40px; }
        .container { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .title { font-size: 22px; font-weight: 700; color: #111; margin-bottom: 8px; }
        .subtitle { font-size: 14px; color: #666; margin-bottom: 24px; }
        .code-box { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0; }
        .code { font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #007AFF; }
        .note { font-size: 13px; color: #999; text-align: center; }
        .footer { margin-top: 32px; font-size: 12px; color: #bbb; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="title">Reset Your Password</div>
        <div class="subtitle">Hi ${name},</div>
        <div class="subtitle">
          We received a request to reset your password. Use the code below
          to create a new password for your Budget Tracker account.
        </div>
        <div class="code-box">
          <div class="code">${code}</div>
        </div>
        <div class="note">This code expires in 10 minutes.</div>
        <div class="footer">
          If you didn't request this, you can safely ignore this email.
        </div>
      </div>
    </body>
    </html>
  `;

    try {
      await this.transporter.sendMail({
        from:
          process.env.SMTP_FROM || "Budget Tracker <noreply@budgettracker.com>",
        to,
        subject: "Your Budget Tracker Password Reset Code",
        html,
      });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}`, error);
      throw error;
    }
  }
}
