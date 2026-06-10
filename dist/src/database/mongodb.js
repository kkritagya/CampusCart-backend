"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const constant_1 = require("../configs/constant");
const connectDatabase = async () => {
    try {
        if (!constant_1.MONGO_URI) {
            throw new Error("MONGO_URI is missing in environment variables");
        }
        await mongoose_1.default.connect(constant_1.MONGO_URI);
        console.log("MongoDB connected successfully");
    }
    catch (error) {
        console.error("MongoDB connection failed", error);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
