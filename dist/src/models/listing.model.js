"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingModel = void 0;
const mongoose_1 = require("mongoose");
const listing_type_1 = require("../types/listing.type");
const listingSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, required: true, trim: true, maxlength: 800 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, enum: listing_type_1.listingCategories, required: true },
    condition: { type: String, enum: listing_type_1.listingConditions, required: true },
    campus: { type: String, enum: listing_type_1.listingCampuses, required: true },
    status: {
        type: String,
        enum: listing_type_1.listingStatuses,
        default: "Active",
        required: true,
    },
    verificationStatus: {
        type: String,
        enum: ["Pending", "Verified", "Rejected"],
        default: "Pending",
        required: true,
        index: true,
    },
    moderationReason: { type: String, trim: true, maxlength: 500 },
    moderatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    moderatedAt: { type: Date },
    tags: { type: [String], default: [] },
    images: { type: [String], default: [] },
    seller: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    views: { type: Number, default: 0, min: 0 },
    enquiries: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
listingSchema.index({ title: "text", description: "text", tags: "text" });
listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ category: 1, condition: 1, campus: 1 });
exports.ListingModel = (0, mongoose_1.model)("Listing", listingSchema);
