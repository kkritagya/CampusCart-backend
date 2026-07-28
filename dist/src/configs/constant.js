"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ESEWA_STATUS_URL = exports.ESEWA_PAYMENT_URL = exports.ESEWA_SECRET_KEY = exports.ESEWA_PRODUCT_CODE = exports.ESEWA_ENVIRONMENT = exports.SMTP_FROM = exports.SMTP_PASS = exports.SMTP_USER = exports.SMTP_SECURE = exports.SMTP_PORT = exports.SMTP_HOST = exports.PASSWORD_RESET_URL = exports.ADMIN_EMAIL = exports.CLIENT_ORIGIN = exports.BCRYPT_SALT_ROUNDS = exports.JWT_EXPIRES_IN = exports.JWT_COOKIE_NAME = exports.JWT_SECRET = exports.MONGO_URI = exports.PORT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.PORT = process.env.PORT || "5000";
exports.MONGO_URI = process.env.MONGO_URI || "";
exports.JWT_SECRET = process.env.JWT_SECRET || "";
exports.JWT_COOKIE_NAME = "token";
exports.JWT_EXPIRES_IN = "7d";
exports.BCRYPT_SALT_ROUNDS = 10;
exports.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";
exports.ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();
exports.PASSWORD_RESET_URL = process.env.PASSWORD_RESET_URL || `${exports.CLIENT_ORIGIN}/reset_password`;
exports.SMTP_HOST = process.env.SMTP_HOST || "";
exports.SMTP_PORT = Number(process.env.SMTP_PORT || "587");
exports.SMTP_SECURE = process.env.SMTP_SECURE === "true";
exports.SMTP_USER = process.env.SMTP_USER || "";
exports.SMTP_PASS = process.env.SMTP_PASS || "";
exports.SMTP_FROM = process.env.SMTP_FROM || "";
exports.ESEWA_ENVIRONMENT = process.env.ESEWA_ENVIRONMENT === "production" ? "production" : "test";
exports.ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || (exports.ESEWA_ENVIRONMENT === "test" ? "EPAYTEST" : "");
exports.ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || (exports.ESEWA_ENVIRONMENT === "test" ? "8gBm/:&EnhH.1/q" : "");
exports.ESEWA_PAYMENT_URL = process.env.ESEWA_PAYMENT_URL ||
    (exports.ESEWA_ENVIRONMENT === "production"
        ? "https://epay.esewa.com.np/api/epay/main/v2/form"
        : "https://rc-epay.esewa.com.np/api/epay/main/v2/form");
exports.ESEWA_STATUS_URL = process.env.ESEWA_STATUS_URL ||
    (exports.ESEWA_ENVIRONMENT === "production"
        ? "https://esewa.com.np/api/epay/transaction/status/"
        : "https://rc.esewa.com.np/api/epay/transaction/status/");
