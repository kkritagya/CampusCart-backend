"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordMobile = exports.verifyPasswordResetOtpMobile = exports.forgotPasswordMobile = exports.resetPassword = exports.forgotPassword = exports.updatePassword = exports.updateProfile = exports.uploadProfilePictureController = exports.logout = exports.getCurrentUser = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const constant_1 = require("../configs/constant");
const user_dto_1 = require("../dtos/user.dto");
const http_exception_1 = require("../exceptions/http-exception");
const user_service_1 = require("../services/user.service");
const apihelper_util_1 = require("../utils/apihelper.util");
const password_reset_service_1 = require("../services/password-reset.service");
const mobile_password_reset_service_1 = require("../services/mobile-password-reset.service");
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
const register = async (req, res) => {
    try {
        const validationError = (0, user_dto_1.validateRegisterDto)(req.body);
        if (validationError) {
            return (0, apihelper_util_1.sendResponse)(res, 400, false, validationError);
        }
        const user = await (0, user_service_1.registerUser)(req.body);
        return (0, apihelper_util_1.sendResponse)(res, 201, true, "User registered successfully", user);
    }
    catch (error) {
        const statusCode = error instanceof http_exception_1.HttpException ? error.statusCode : 500;
        const message = error instanceof Error ? error.message : "Registration failed";
        return (0, apihelper_util_1.sendResponse)(res, statusCode, false, message);
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const validationError = (0, user_dto_1.validateLoginDto)(req.body);
        if (validationError) {
            return (0, apihelper_util_1.sendResponse)(res, 400, false, validationError);
        }
        const { user, token } = await (0, user_service_1.loginUser)(req.body);
        res.cookie(constant_1.JWT_COOKIE_NAME, token, cookieOptions);
        let adminToken;
        if (req.body?.adminReauth === true) {
            if (user.role !== "admin" || user.status !== "active") {
                return (0, apihelper_util_1.sendResponse)(res, 403, false, "Admin access required");
            }
            adminToken = jsonwebtoken_1.default.sign({ userId: user.id, purpose: "admin" }, constant_1.JWT_SECRET, { expiresIn: "15m" });
            res.cookie("admin_session", adminToken, {
                ...cookieOptions,
                maxAge: 15 * 60 * 1000,
            });
        }
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Login successful", {
            user,
            token,
            ...(adminToken ? { adminToken } : {}),
        });
    }
    catch (error) {
        const statusCode = error instanceof http_exception_1.HttpException ? error.statusCode : 500;
        const message = error instanceof Error ? error.message : "Login failed";
        return (0, apihelper_util_1.sendResponse)(res, statusCode, false, message);
    }
};
exports.login = login;
const getCurrentUser = async (req, res) => {
    try {
        if (!req.user) {
            return (0, apihelper_util_1.sendResponse)(res, 401, false, "Unauthorized");
        }
        const user = await (0, user_service_1.getUserById)(req.user.id);
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Current user fetched successfully", user);
    }
    catch (error) {
        const statusCode = error instanceof http_exception_1.HttpException ? error.statusCode : 500;
        const message = error instanceof Error ? error.message : "Failed to fetch current user";
        return (0, apihelper_util_1.sendResponse)(res, statusCode, false, message);
    }
};
exports.getCurrentUser = getCurrentUser;
const logout = async (_req, res) => {
    try {
        res.clearCookie(constant_1.JWT_COOKIE_NAME, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });
        res.clearCookie("admin_session", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Logout successful");
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Logout failed";
        return (0, apihelper_util_1.sendResponse)(res, 500, false, message);
    }
};
exports.logout = logout;
const uploadProfilePictureController = async (req, res) => {
    try {
        if (!req.user) {
            return (0, apihelper_util_1.sendResponse)(res, 401, false, "Unauthorized");
        }
        if (!req.file) {
            return (0, apihelper_util_1.sendResponse)(res, 400, false, "Please upload a file");
        }
        const profilePicturePath = `/uploads/profile_pics/${req.file.filename}`;
        const user = await (0, user_service_1.updateUserProfilePictureService)(req.user.id, profilePicturePath);
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Profile picture uploaded successfully", user);
    }
    catch (error) {
        const statusCode = error instanceof http_exception_1.HttpException ? error.statusCode : 500;
        const message = error instanceof Error ? error.message : "Failed to upload profile picture";
        return (0, apihelper_util_1.sendResponse)(res, statusCode, false, message);
    }
};
exports.uploadProfilePictureController = uploadProfilePictureController;
const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            return (0, apihelper_util_1.sendResponse)(res, 401, false, "Unauthorized");
        }
        const { fullName, phone, address } = req.body;
        if (!fullName || fullName.trim().length < 2) {
            return (0, apihelper_util_1.sendResponse)(res, 400, false, "Full name must be at least 2 characters");
        }
        let profilePicture = undefined;
        if (req.file) {
            profilePicture = `/uploads/profile_pics/${req.file.filename}`;
        }
        const user = await (0, user_service_1.updateUserProfileService)(req.user.id, {
            fullName,
            phone,
            address,
            profilePicture,
        });
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Profile updated successfully", user);
    }
    catch (error) {
        const statusCode = error instanceof http_exception_1.HttpException ? error.statusCode : 500;
        const message = error instanceof Error ? error.message : "Failed to update profile";
        return (0, apihelper_util_1.sendResponse)(res, statusCode, false, message);
    }
};
exports.updateProfile = updateProfile;
const updatePassword = async (req, res) => {
    try {
        if (!req.user) {
            return (0, apihelper_util_1.sendResponse)(res, 401, false, "Unauthorized");
        }
        const { currentPassword, newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return (0, apihelper_util_1.sendResponse)(res, 400, false, "New password must be at least 6 characters");
        }
        await (0, user_service_1.updateUserPasswordService)(req.user.id, currentPassword, newPassword);
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Password updated successfully");
    }
    catch (error) {
        const statusCode = error instanceof http_exception_1.HttpException ? error.statusCode : 500;
        const message = error instanceof Error ? error.message : "Failed to update password";
        return (0, apihelper_util_1.sendResponse)(res, statusCode, false, message);
    }
};
exports.updatePassword = updatePassword;
const forgotPassword = async (req, res) => {
    try {
        const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return (0, apihelper_util_1.sendResponse)(res, 400, false, "A valid email is required");
        }
        await (0, password_reset_service_1.requestPasswordReset)(email);
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "If an account exists for that email, a reset link has been sent.");
    }
    catch (error) {
        const statusCode = error instanceof http_exception_1.HttpException ? error.statusCode : 500;
        const message = error instanceof Error ? error.message : "Failed to request password reset";
        return (0, apihelper_util_1.sendResponse)(res, statusCode, false, message);
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const token = typeof req.body?.token === "string" ? req.body.token : "";
        const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
        if (!token)
            return (0, apihelper_util_1.sendResponse)(res, 400, false, "Reset token is required");
        if (newPassword.length < 8) {
            return (0, apihelper_util_1.sendResponse)(res, 400, false, "New password must be at least 8 characters");
        }
        await (0, password_reset_service_1.resetPassword)(token, newPassword);
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Password reset successfully");
    }
    catch (error) {
        const statusCode = error instanceof http_exception_1.HttpException ? error.statusCode : 500;
        const message = error instanceof Error ? error.message : "Password reset failed";
        return (0, apihelper_util_1.sendResponse)(res, statusCode, false, message);
    }
};
exports.resetPassword = resetPassword;
const forgotPasswordMobile = async (req, res) => {
    try {
        const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return (0, apihelper_util_1.sendResponse)(res, 400, false, "A valid email is required");
        }
        await (0, mobile_password_reset_service_1.requestMobilePasswordReset)(email);
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "If an account exists for that email, a 6-digit code has been sent.");
    }
    catch (error) {
        const statusCode = error instanceof http_exception_1.HttpException ? error.statusCode : 500;
        const message = error instanceof Error ? error.message : "Failed to send reset code";
        return (0, apihelper_util_1.sendResponse)(res, statusCode, false, message);
    }
};
exports.forgotPasswordMobile = forgotPasswordMobile;
const verifyPasswordResetOtpMobile = async (req, res) => {
    try {
        const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
        const otp = typeof req.body?.otp === "string" ? req.body.otp.trim() : "";
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return (0, apihelper_util_1.sendResponse)(res, 400, false, "A valid email is required");
        }
        if (!/^\d{6}$/.test(otp)) {
            return (0, apihelper_util_1.sendResponse)(res, 400, false, "Enter the 6-digit OTP");
        }
        const resetToken = await (0, mobile_password_reset_service_1.verifyMobilePasswordResetOtp)(email, otp);
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "OTP verified", { resetToken });
    }
    catch (error) {
        const statusCode = error instanceof http_exception_1.HttpException ? error.statusCode : 500;
        const message = error instanceof Error ? error.message : "Failed to verify reset code";
        return (0, apihelper_util_1.sendResponse)(res, statusCode, false, message);
    }
};
exports.verifyPasswordResetOtpMobile = verifyPasswordResetOtpMobile;
const resetPasswordMobile = async (req, res) => {
    try {
        const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
        const resetToken = typeof req.body?.resetToken === "string" ? req.body.resetToken : "";
        const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
        if (!email || !resetToken) {
            return (0, apihelper_util_1.sendResponse)(res, 400, false, "Reset session is required");
        }
        if (newPassword.length < 8) {
            return (0, apihelper_util_1.sendResponse)(res, 400, false, "New password must be at least 8 characters");
        }
        await (0, mobile_password_reset_service_1.resetMobilePassword)(email, resetToken, newPassword);
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Password reset successfully");
    }
    catch (error) {
        const statusCode = error instanceof http_exception_1.HttpException ? error.statusCode : 500;
        const message = error instanceof Error ? error.message : "Password reset failed";
        return (0, apihelper_util_1.sendResponse)(res, statusCode, false, message);
    }
};
exports.resetPasswordMobile = resetPasswordMobile;
