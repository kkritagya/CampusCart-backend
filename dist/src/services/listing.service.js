"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toListingResponse = toListingResponse;
exports.createListing = createListing;
exports.getListings = getListings;
exports.getListing = getListing;
exports.getMyListings = getMyListings;
exports.updateListing = updateListing;
exports.deleteListing = deleteListing;
const mongoose_1 = require("mongoose");
const http_exception_1 = require("../exceptions/http-exception");
const listing_repository_1 = require("../repositories/listing.repository");
const user_repository_1 = require("../repositories/user.repository");
async function toListingResponse(listing) {
    const seller = await (0, user_repository_1.findUserById)(listing.seller.toString());
    if (!seller)
        throw new http_exception_1.HttpException(500, "Listing seller could not be resolved");
    return {
        id: listing._id.toString(),
        title: listing.title,
        description: listing.description,
        price: listing.price,
        category: listing.category,
        condition: listing.condition,
        campus: listing.campus,
        status: listing.status,
        verificationStatus: listing.verificationStatus ?? "Pending",
        moderationReason: listing.moderationReason,
        moderatedAt: listing.moderatedAt,
        tags: listing.tags,
        images: listing.images,
        seller: {
            id: seller._id.toString(),
            fullName: seller.fullName,
            profilePicture: seller.profilePicture,
        },
        views: listing.views,
        enquiries: listing.enquiries,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt,
    };
}
function requireValidId(id) {
    if (!(0, mongoose_1.isValidObjectId)(id))
        throw new http_exception_1.HttpException(400, "Invalid listing ID");
}
function requireOwnership(listing, userId) {
    if (listing.seller.toString() !== userId) {
        throw new http_exception_1.HttpException(403, "You can only manage your own listings");
    }
}
async function createListing(userId, dto) {
    const listing = await (0, listing_repository_1.createListingRecord)({
        ...dto,
        verificationStatus: "Pending",
        seller: new mongoose_1.Types.ObjectId(userId),
    });
    return toListingResponse(listing);
}
async function getListings(query) {
    const { items, total } = await (0, listing_repository_1.findListings)(query);
    return {
        items: await Promise.all(items.map(toListingResponse)),
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
        },
    };
}
async function getListing(id) {
    requireValidId(id);
    const listing = await (0, listing_repository_1.findListingById)(id);
    if (!listing ||
        listing.status === "Draft" ||
        listing.verificationStatus !== "Verified") {
        throw new http_exception_1.HttpException(404, "Listing not found");
    }
    return toListingResponse(listing);
}
async function getMyListings(userId) {
    const listings = await (0, listing_repository_1.findListingsBySeller)(userId);
    return Promise.all(listings.map(toListingResponse));
}
async function updateListing(id, userId, dto) {
    requireValidId(id);
    const existing = await (0, listing_repository_1.findListingById)(id);
    if (!existing)
        throw new http_exception_1.HttpException(404, "Listing not found");
    requireOwnership(existing, userId);
    const listing = await (0, listing_repository_1.updateListingRecord)(id, {
        ...dto,
        verificationStatus: "Pending",
        moderationReason: undefined,
        moderatedBy: undefined,
        moderatedAt: undefined,
    });
    if (!listing)
        throw new http_exception_1.HttpException(404, "Listing not found");
    return toListingResponse(listing);
}
async function deleteListing(id, userId) {
    requireValidId(id);
    const existing = await (0, listing_repository_1.findListingById)(id);
    if (!existing)
        throw new http_exception_1.HttpException(404, "Listing not found");
    requireOwnership(existing, userId);
    await (0, listing_repository_1.deleteListingRecord)(id);
}
