"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobilePasswordResetModel = void 0;
const mongoose_1 = require("mongoose");
const mobilePasswordResetSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    otpHash: { type: String, required: true },
    otpSalt: { type: String, required: true },
    attempts: { type: Number, default: 0, min: 0 },
    resetTokenHash: { type: String, index: true, sparse: true },
    verifiedAt: { type: Date },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });
exports.MobilePasswordResetModel = (0, mongoose_1.model)("MobilePasswordReset", mobilePasswordResetSchema);
