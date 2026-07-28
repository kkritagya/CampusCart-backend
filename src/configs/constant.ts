import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || "5000";
export const MONGO_URI = process.env.MONGO_URI || "";
export const JWT_SECRET = process.env.JWT_SECRET || "";
export const JWT_COOKIE_NAME = "token";
export const JWT_EXPIRES_IN = "7d";
export const BCRYPT_SALT_ROUNDS = 10;

export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();
export const PASSWORD_RESET_URL =
  process.env.PASSWORD_RESET_URL || `${CLIENT_ORIGIN}/reset_password`;
export const SMTP_HOST = process.env.SMTP_HOST || "";
export const SMTP_PORT = Number(process.env.SMTP_PORT || "587");
export const SMTP_SECURE = process.env.SMTP_SECURE === "true";
export const SMTP_USER = process.env.SMTP_USER || "";
export const SMTP_PASS = process.env.SMTP_PASS || "";
export const SMTP_FROM = process.env.SMTP_FROM || "";
export const ESEWA_ENVIRONMENT = process.env.ESEWA_ENVIRONMENT === "production" ? "production" : "test";
export const ESEWA_PRODUCT_CODE =
  process.env.ESEWA_PRODUCT_CODE || (ESEWA_ENVIRONMENT === "test" ? "EPAYTEST" : "");
export const ESEWA_SECRET_KEY =
  process.env.ESEWA_SECRET_KEY || (ESEWA_ENVIRONMENT === "test" ? "8gBm/:&EnhH.1/q" : "");
export const ESEWA_PAYMENT_URL =
  process.env.ESEWA_PAYMENT_URL ||
  (ESEWA_ENVIRONMENT === "production"
    ? "https://epay.esewa.com.np/api/epay/main/v2/form"
    : "https://rc-epay.esewa.com.np/api/epay/main/v2/form");
export const ESEWA_STATUS_URL =
  process.env.ESEWA_STATUS_URL ||
  (ESEWA_ENVIRONMENT === "production"
    ? "https://esewa.com.np/api/epay/transaction/status/"
    : "https://rc.esewa.com.np/api/epay/transaction/status/");
