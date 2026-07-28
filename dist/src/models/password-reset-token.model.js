"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetTokenModel = void 0;
const mongoose_1 = require("mongoose");
const passwordResetTokenSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });
exports.PasswordResetTokenModel = (0, mongoose_1.model)("PasswordResetToken", passwordResetTokenSchema);
