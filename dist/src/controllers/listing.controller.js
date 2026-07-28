"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listListings = listListings;
exports.showListing = showListing;
exports.listMyListings = listMyListings;
exports.addListing = addListing;
exports.editListing = editListing;
exports.removeListing = removeListing;
const listing_dto_1 = require("../dtos/listing.dto");
const http_exception_1 = require("../exceptions/http-exception");
const listing_service_1 = require("../services/listing.service");
const apihelper_util_1 = require("../utils/apihelper.util");
function sendControllerError(res, error, fallback) {
    const statusCode = error instanceof http_exception_1.HttpException ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : fallback;
    return (0, apihelper_util_1.sendResponse)(res, statusCode, false, message);
}
function routeId(value) {
    return Array.isArray(value) ? value[0] : value;
}
function uploadedImagePaths(req) {
    const files = Array.isArray(req.files) ? req.files : [];
    return files.map((file) => `/uploads/listings/${file.filename}`);
}
function normalizeListingBody(req, includeImages) {
    const body = { ...req.body };
    if (typeof body.tags === "string") {
        const tags = body.tags;
        try {
            const parsed = JSON.parse(tags);
            body.tags = Array.isArray(parsed) ? parsed : [];
        }
        catch {
            body.tags = tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean);
        }
    }
    const images = uploadedImagePaths(req);
    if (includeImages || images.length > 0)
        body.images = images;
    return body;
}
async function listListings(req, res) {
    try {
        const parsed = listing_dto_1.listingQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return (0, apihelper_util_1.sendResponse)(res, 400, false, (0, listing_dto_1.formatZodError)(parsed.error));
        }
        const result = await (0, listing_service_1.getListings)(parsed.data);
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Listings fetched successfully", result);
    }
    catch (error) {
        return sendControllerError(res, error, "Failed to fetch listings");
    }
}
async function showListing(req, res) {
    try {
        const listing = await (0, listing_service_1.getListing)(routeId(req.params.id));
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Listing fetched successfully", listing);
    }
    catch (error) {
        return sendControllerError(res, error, "Failed to fetch listing");
    }
}
async function listMyListings(req, res) {
    try {
        if (!req.user)
            return (0, apihelper_util_1.sendResponse)(res, 401, false, "Unauthorized");
        const listings = await (0, listing_service_1.getMyListings)(req.user.id);
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Your listings fetched successfully", listings);
    }
    catch (error) {
        return sendControllerError(res, error, "Failed to fetch your listings");
    }
}
async function addListing(req, res) {
    try {
        if (!req.user)
            return (0, apihelper_util_1.sendResponse)(res, 401, false, "Unauthorized");
        const parsed = listing_dto_1.createListingSchema.safeParse(normalizeListingBody(req, true));
        if (!parsed.success) {
            return (0, apihelper_util_1.sendResponse)(res, 400, false, (0, listing_dto_1.formatZodError)(parsed.error));
        }
        const listing = await (0, listing_service_1.createListing)(req.user.id, parsed.data);
        res.location(`/api/v1/listings/${listing.id}`);
        return (0, apihelper_util_1.sendResponse)(res, 201, true, "Listing submitted for admin verification", listing);
    }
    catch (error) {
        return sendControllerError(res, error, "Failed to create listing");
    }
}
async function editListing(req, res) {
    try {
        if (!req.user)
            return (0, apihelper_util_1.sendResponse)(res, 401, false, "Unauthorized");
        const parsed = listing_dto_1.updateListingSchema.safeParse(normalizeListingBody(req, false));
        if (!parsed.success) {
            return (0, apihelper_util_1.sendResponse)(res, 400, false, (0, listing_dto_1.formatZodError)(parsed.error));
        }
        const listing = await (0, listing_service_1.updateListing)(routeId(req.params.id), req.user.id, parsed.data);
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Listing updated and submitted for admin verification", listing);
    }
    catch (error) {
        return sendControllerError(res, error, "Failed to update listing");
    }
}
async function removeListing(req, res) {
    try {
        if (!req.user)
            return (0, apihelper_util_1.sendResponse)(res, 401, false, "Unauthorized");
        await (0, listing_service_1.deleteListing)(routeId(req.params.id), req.user.id);
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Listing deleted successfully");
    }
    catch (error) {
        return sendControllerError(res, error, "Failed to delete listing");
    }
}
