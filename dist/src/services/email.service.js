"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lastTestResetOtp = exports.lastTestResetLink = void 0;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
exports.sendPasswordResetOtpEmail = sendPasswordResetOtpEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const constant_1 = require("../configs/constant");
const http_exception_1 = require("../exceptions/http-exception");
exports.lastTestResetLink = null;
exports.lastTestResetOtp = null;
async function sendPasswordResetEmail(recipient, resetLink) {
    if (process.env.NODE_ENV === "test") {
        exports.lastTestResetLink = resetLink;
        return;
    }
    if (!constant_1.SMTP_HOST || !constant_1.SMTP_USER || !constant_1.SMTP_PASS || !constant_1.SMTP_FROM) {
        throw new http_exception_1.HttpException(503, "Password reset email is temporarily unavailable");
    }
    const transporter = nodemailer_1.default.createTransport({
        host: constant_1.SMTP_HOST,
        port: constant_1.SMTP_PORT,
        secure: constant_1.SMTP_SECURE,
        auth: { user: constant_1.SMTP_USER, pass: constant_1.SMTP_PASS },
    });
    await transporter.sendMail({
        from: constant_1.SMTP_FROM,
        to: recipient,
        subject: "Reset your CampusCart password",
        text: `Reset your CampusCart password using this link: ${resetLink}\n\nThis link expires in one hour. If you did not request this, you can ignore this email.`,
        html: `<p>Reset your CampusCart password using the secure link below.</p><p><a href="${resetLink}">Reset password</a></p><p>This link expires in one hour. If you did not request this, you can ignore this email.</p>`,
    });
}
async function sendPasswordResetOtpEmail(recipient, otp) {
    if (process.env.NODE_ENV === "test") {
        exports.lastTestResetOtp = otp;
        return;
    }
    if (!constant_1.SMTP_HOST || !constant_1.SMTP_USER || !constant_1.SMTP_PASS || !constant_1.SMTP_FROM) {
        throw new http_exception_1.HttpException(503, "Password reset email is temporarily unavailable");
    }
    const transporter = nodemailer_1.default.createTransport({
        host: constant_1.SMTP_HOST,
        port: constant_1.SMTP_PORT,
        secure: constant_1.SMTP_SECURE,
        auth: { user: constant_1.SMTP_USER, pass: constant_1.SMTP_PASS },
    });
    await transporter.sendMail({
        from: constant_1.SMTP_FROM,
        to: recipient,
        subject: "Your CampusCart password reset code",
        text: `Your CampusCart password reset code is ${otp}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
        html: `<p>Your CampusCart password reset code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</p><p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>`,
    });
}
