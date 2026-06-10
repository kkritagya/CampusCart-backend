import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || "5000";
export const MONGO_URI = process.env.MONGO_URI || "";
export const JWT_SECRET = process.env.JWT_SECRET || "";
export const JWT_COOKIE_NAME = "token";
export const JWT_EXPIRES_IN = "7d";
export const BCRYPT_SALT_ROUNDS = 10;

export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";
