"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const constant_1 = require("../configs/constant");
const http_exception_1 = require("../exceptions/http-exception");
const user_repository_1 = require("../repositories/user.repository");
const apihelper_util_1 = require("../utils/apihelper.util");
const getCookieValue = (cookieHeader, cookieName) => {
    if (!cookieHeader) {
        return null;
    }
    const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
    const cookie = cookies.find((item) => item.startsWith(`${cookieName}=`));
    return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
};
const getBearerToken = (authHeader) => {
    if (!authHeader?.startsWith("Bearer ")) {
        return null;
    }
    const token = authHeader.slice(7).trim();
    return token || null;
};
const authorize = async (req, res, next) => {
    try {
        const token = getCookieValue(req.headers.cookie, constant_1.JWT_COOKIE_NAME) ??
            getBearerToken(req.headers.authorization);
        if (!token) {
            throw new http_exception_1.HttpException(401, "Unauthorized: token is missing");
        }
        if (!constant_1.JWT_SECRET) {
            throw new http_exception_1.HttpException(500, "JWT_SECRET is missing in environment variables");
        }
        const decoded = jsonwebtoken_1.default.verify(token, constant_1.JWT_SECRET);
        const user = await (0, user_repository_1.findUserById)(decoded.userId);
        if (!user) {
            throw new http_exception_1.HttpException(401, "Unauthorized: user no longer exists");
        }
        req.user = {
            id: user._id.toString(),
            fullName: user.fullName,
            email: user.email,
        };
        next();
    }
    catch (error) {
        const statusCode = error instanceof http_exception_1.HttpException ? error.statusCode : 401;
        const message = error instanceof Error ? error.message : "Unauthorized";
        return (0, apihelper_util_1.sendResponse)(res, statusCode, false, message);
    }
};
exports.authorize = authorize;
