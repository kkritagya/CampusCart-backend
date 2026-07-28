"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestPasswordReset = requestPasswordReset;
exports.resetPassword = resetPassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = require("crypto");
const constant_1 = require("../configs/constant");
const http_exception_1 = require("../exceptions/http-exception");
const password_reset_token_model_1 = require("../models/password-reset-token.model");
const user_repository_1 = require("../repositories/user.repository");
const email_service_1 = require("./email.service");
const constant_2 = require("../configs/constant");
const RESET_EXPIRY_MS = 60 * 60 * 1000;
const hashToken = (token) => (0, crypto_1.createHash)("sha256").update(token).digest("hex");
async function requestPasswordReset(email) {
    const user = await (0, user_repository_1.findUserByEmail)(email);
    if (!user)
        return;
    const token = (0, crypto_1.randomBytes)(32).toString("hex");
    await password_reset_token_model_1.PasswordResetTokenModel.deleteMany({ user: user._id });
    await password_reset_token_model_1.PasswordResetTokenModel.create({
        user: user._id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_EXPIRY_MS),
    });
    const resetLink = `${constant_1.PASSWORD_RESET_URL}?token=${encodeURIComponent(token)}`;
    try {
        await (0, email_service_1.sendPasswordResetEmail)(user.email, resetLink);
    }
    catch (error) {
        await password_reset_token_model_1.PasswordResetTokenModel.deleteMany({ user: user._id });
        throw error;
    }
}
async function resetPassword(token, newPassword) {
    const record = await password_reset_token_model_1.PasswordResetTokenModel.findOne({
        tokenHash: hashToken(token),
        expiresAt: { $gt: new Date() },
    });
    if (!record) {
        throw new http_exception_1.HttpException(400, "Reset link is invalid or has expired");
    }
    const password = await bcryptjs_1.default.hash(newPassword, constant_2.BCRYPT_SALT_ROUNDS);
    const user = await (0, user_repository_1.updateUser)(record.user.toString(), { password });
    if (!user)
        throw new http_exception_1.HttpException(404, "User not found");
    await password_reset_token_model_1.PasswordResetTokenModel.deleteMany({ user: record.user });
}
