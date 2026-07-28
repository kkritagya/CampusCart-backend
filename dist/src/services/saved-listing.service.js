"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSavedListings = getSavedListings;
exports.saveListing = saveListing;
exports.unsaveListing = unsaveListing;
const mongoose_1 = require("mongoose");
const http_exception_1 = require("../exceptions/http-exception");
const listing_repository_1 = require("../repositories/listing.repository");
const saved_listing_repository_1 = require("../repositories/saved-listing.repository");
const listing_service_1 = require("./listing.service");
function validateListingId(id) {
    if (!(0, mongoose_1.isValidObjectId)(id))
        throw new http_exception_1.HttpException(400, "Invalid listing ID");
}
async function getSavedListings(userId) {
    const entries = await (0, saved_listing_repository_1.findSavedByUser)(userId);
    const listings = await Promise.all(entries.map((entry) => (0, listing_repository_1.findListingById)(entry.listing.toString())));
    return Promise.all(listings
        .filter((listing) => listing &&
        listing.status !== "Draft" &&
        listing.verificationStatus === "Verified")
        .map((listing) => (0, listing_service_1.toListingResponse)(listing)));
}
async function saveListing(userId, listingId) {
    validateListingId(listingId);
    const listing = await (0, listing_repository_1.findListingById)(listingId);
    if (!listing ||
        listing.status === "Draft" ||
        listing.verificationStatus !== "Verified") {
        throw new http_exception_1.HttpException(404, "Listing not found");
    }
    await (0, saved_listing_repository_1.createSavedEntry)(userId, listingId);
    return (0, listing_service_1.toListingResponse)(listing);
}
async function unsaveListing(userId, listingId) {
    validateListingId(listingId);
    const entry = await (0, saved_listing_repository_1.findSavedEntry)(userId, listingId);
    if (!entry)
        throw new http_exception_1.HttpException(404, "Saved listing not found");
    await (0, saved_listing_repository_1.deleteSavedEntry)(userId, listingId);
}
