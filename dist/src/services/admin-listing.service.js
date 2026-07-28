"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listModerationListings = listModerationListings;
exports.moderateListing = moderateListing;
exports.removeModerationListing = removeModerationListing;
const mongoose_1 = require("mongoose");
const http_exception_1 = require("../exceptions/http-exception");
const cart_model_1 = require("../models/cart.model");
const listing_model_1 = require("../models/listing.model");
const saved_listing_model_1 = require("../models/saved-listing.model");
const listing_service_1 = require("./listing.service");
const notification_service_1 = require("./notification.service");
const validId = (id) => {
    if (!(0, mongoose_1.isValidObjectId)(id))
        throw new http_exception_1.HttpException(400, "Invalid listing ID");
};
async function listModerationListings(status) {
    const filter = {};
    if (status && status !== "All") {
        filter.verificationStatus = status;
    }
    const listings = await listing_model_1.ListingModel.find(filter).sort({ createdAt: -1 }).limit(200);
    return Promise.all(listings.map(listing_service_1.toListingResponse));
}
async function moderateListing(id, adminId, verificationStatus, reason) {
    validId(id);
    if (verificationStatus === "Rejected" && !reason?.trim()) {
        throw new http_exception_1.HttpException(400, "A rejection reason is required");
    }
    const listing = await listing_model_1.ListingModel.findByIdAndUpdate(id, {
        verificationStatus,
        moderationReason: verificationStatus === "Rejected" ? reason.trim() : undefined,
        moderatedBy: new mongoose_1.Types.ObjectId(adminId),
        moderatedAt: new Date(),
    }, { new: true, runValidators: true });
    if (!listing)
        throw new http_exception_1.HttpException(404, "Listing not found");
    await (0, notification_service_1.createNotification)({
        recipient: listing.seller,
        type: "moderation",
        title: verificationStatus === "Verified"
            ? "Listing approved"
            : "Listing needs changes",
        body: verificationStatus === "Verified"
            ? `Your listing “${listing.title}” is now live in the marketplace.`
            : `Your listing “${listing.title}” was rejected: ${reason.trim()}`,
        href: verificationStatus === "Verified"
            ? `/marketplace/${listing._id}`
            : `/dashboard/listings/${listing._id}/edit`,
    });
    return (0, listing_service_1.toListingResponse)(listing);
}
async function removeModerationListing(id) {
    validId(id);
    const listing = await listing_model_1.ListingModel.findByIdAndDelete(id);
    if (!listing)
        throw new http_exception_1.HttpException(404, "Listing not found");
    await Promise.all([
        saved_listing_model_1.SavedListingModel.deleteMany({ listing: listing._id }),
        cart_model_1.CartModel.updateMany({}, { $pull: { listings: listing._id } }),
    ]);
}
