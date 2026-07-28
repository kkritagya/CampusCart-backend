"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationModel = void 0;
const mongoose_1 = require("mongoose");
const conversationSchema = new mongoose_1.Schema({
    listing: { type: mongoose_1.Schema.Types.ObjectId, ref: "Listing", required: true },
    participants: {
        type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true }],
        validate: {
            validator: (participants) => participants.length === 2,
            message: "A conversation requires exactly two participants",
        },
    },
}, { timestamps: true });
conversationSchema.index({ listing: 1, participants: 1 });
conversationSchema.index({ participants: 1, updatedAt: -1 });
exports.ConversationModel = (0, mongoose_1.model)("Conversation", conversationSchema);
