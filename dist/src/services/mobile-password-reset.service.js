"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestMobilePasswordReset = requestMobilePasswordReset;
exports.verifyMobilePasswordResetOtp = verifyMobilePasswordResetOtp;
exports.resetMobilePassword = resetMobilePassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = require("crypto");
const constant_1 = require("../configs/constant");
const http_exception_1 = require("../exceptions/http-exception");
const mobile_password_reset_model_1 = require("../models/mobile-password-reset.model");
const user_repository_1 = require("../repositories/user.repository");
const email_service_1 = require("./email.service");
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const VERIFIED_EXPIRY_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const hash = (value) => (0, crypto_1.createHash)("sha256").update(value).digest("hex");
const otpHash = (salt, otp) => hash(`${salt}:${otp}`);
function safeEqual(left, right) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return (leftBuffer.length === rightBuffer.length &&
        (0, crypto_1.timingSafeEqual)(leftBuffer, rightBuffer));
}
async function requestMobilePasswordReset(emailInput) {
    const email = emailInput.trim().toLowerCase();
    const user = await (0, user_repository_1.findUserByEmail)(email);
    if (!user)
        return;
    const otp = (0, crypto_1.randomInt)(0, 1000000).toString().padStart(6, "0");
    const salt = (0, crypto_1.randomBytes)(16).toString("hex");
    await mobile_password_reset_model_1.MobilePasswordResetModel.findOneAndUpdate({ user: user._id }, {
        $set: {
            user: user._id,
            email: user.email,
            otpHash: otpHash(salt, otp),
            otpSalt: salt,
            attempts: 0,
            expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
        },
        $unset: { resetTokenHash: 1, verifiedAt: 1 },
    }, { upsert: true, returnDocument: "after" });
    try {
        await (0, email_service_1.sendPasswordResetOtpEmail)(user.email, otp);
    }
    catch (error) {
        await mobile_password_reset_model_1.MobilePasswordResetModel.deleteOne({ user: user._id });
        throw error;
    }
}
async function verifyMobilePasswordResetOtp(emailInput, otp) {
    const email = emailInput.trim().toLowerCase();
    const record = await mobile_password_reset_model_1.MobilePasswordResetModel.findOne({
        email,
        expiresAt: { $gt: new Date() },
    });
    if (!record || record.attempts >= MAX_ATTEMPTS) {
        throw new http_exception_1.HttpException(400, "OTP is invalid or has expired");
    }
    const matches = safeEqual(record.otpHash, otpHash(record.otpSalt, otp));
    if (!matches) {
        record.attempts += 1;
        await record.save();
        throw new http_exception_1.HttpException(400, "OTP is invalid or has expired");
    }
    const resetToken = (0, crypto_1.randomBytes)(32).toString("hex");
    record.resetTokenHash = hash(resetToken);
    record.verifiedAt = new Date();
    record.expiresAt = new Date(Date.now() + VERIFIED_EXPIRY_MS);
    await record.save();
    return resetToken;
}
async function resetMobilePassword(emailInput, resetToken, newPassword) {
    const email = emailInput.trim().toLowerCase();
    const record = await mobile_password_reset_model_1.MobilePasswordResetModel.findOne({
        email,
        resetTokenHash: hash(resetToken),
        verifiedAt: { $exists: true },
        expiresAt: { $gt: new Date() },
    });
    if (!record) {
        throw new http_exception_1.HttpException(400, "Reset session is invalid or has expired");
    }
    const password = await bcryptjs_1.default.hash(newPassword, constant_1.BCRYPT_SALT_ROUNDS);
    const user = await (0, user_repository_1.updateUser)(record.user.toString(), { password });
    if (!user)
        throw new http_exception_1.HttpException(404, "User not found");
    await mobile_password_reset_model_1.MobilePasswordResetModel.deleteOne({ _id: record._id });
}
