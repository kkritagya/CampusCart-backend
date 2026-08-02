import nodemailer from "nodemailer";
import {
  SMTP_FROM,
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
} from "../configs/constant";
import { HttpException } from "../exceptions/http-exception";

export let lastTestResetLink: string | null = null;
export let lastTestResetOtp: string | null = null;

export async function sendPasswordResetEmail(
  recipient: string,
  resetLink: string
) {
  if (process.env.NODE_ENV === "test") {
    lastTestResetLink = resetLink;
    return;
  }
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new HttpException(
      503,
      "Password reset email is temporarily unavailable"
    );
  }
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  await transporter.sendMail({
    from: SMTP_FROM,
    to: recipient,
    subject: "Reset your CampusCart password",
    text: `Reset your CampusCart password using this link: ${resetLink}\n\nThis link expires in one hour. If you did not request this, you can ignore this email.`,
    html: `<p>Reset your CampusCart password using the secure link below.</p><p><a href="${resetLink}">Reset password</a></p><p>This link expires in one hour. If you did not request this, you can ignore this email.</p>`,
  });
}

export async function sendPasswordResetOtpEmail(
  recipient: string,
  otp: string
) {
  if (process.env.NODE_ENV === "test") {
    lastTestResetOtp = otp;
    return;
  }
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new HttpException(
      503,
      "Password reset email is temporarily unavailable"
    );
  }
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  await transporter.sendMail({
    from: SMTP_FROM,
    to: recipient,
    subject: "Your CampusCart password reset code",
    text: `Your CampusCart password reset code is ${otp}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
    html: `<p>Your CampusCart password reset code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</p><p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>`,
  });
}
