"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.getCurrentUser = exports.login = exports.register = void 0;
const constant_1 = require("../configs/constant");
const user_dto_1 = require("../dtos/user.dto");
const http_exception_1 = require("../exceptions/http-exception");
const user_service_1 = require("../services/user.service");
const apihelper_util_1 = require("../utils/apihelper.util");
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
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Login successful", { user, token });
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
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Logout successful");
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Logout failed";
        return (0, apihelper_util_1.sendResponse)(res, 500, false, message);
    }
};
exports.logout = logout;
