"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIENT_ORIGIN = exports.BCRYPT_SALT_ROUNDS = exports.JWT_EXPIRES_IN = exports.JWT_COOKIE_NAME = exports.JWT_SECRET = exports.MONGO_URI = exports.PORT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.PORT = process.env.PORT || "5000";
exports.MONGO_URI = process.env.MONGO_URI || "";
exports.JWT_SECRET = process.env.JWT_SECRET || "";
exports.JWT_COOKIE_NAME = "token";
exports.JWT_EXPIRES_IN = "7d";
exports.BCRYPT_SALT_ROUNDS = 10;
exports.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";
