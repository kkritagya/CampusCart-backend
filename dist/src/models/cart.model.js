"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartModel = void 0;
const mongoose_1 = require("mongoose");
const cartSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    listings: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Listing", required: true }],
}, { timestamps: true });
exports.CartModel = (0, mongoose_1.model)("Cart", cartSchema);
