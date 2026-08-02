"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModel = void 0;
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    recipient: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ["message", "sale", "moderation", "saved", "cart", "purchase"],
        required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, trim: true, maxlength: 500 },
    href: { type: String, required: true, maxlength: 300 },
    read: { type: Boolean, default: false, index: true },
}, { timestamps: true });
notificationSchema.index({ recipient: 1, createdAt: -1 });
exports.NotificationModel = (0, mongoose_1.model)("Notification", notificationSchema);
