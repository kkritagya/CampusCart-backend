"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedListingModel = void 0;
const mongoose_1 = require("mongoose");
const savedListingSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    listing: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Listing",
        required: true,
        index: true,
    },
}, { timestamps: true });
savedListingSchema.index({ user: 1, listing: 1 }, { unique: true });
exports.SavedListingModel = (0, mongoose_1.model)("SavedListing", savedListingSchema);
