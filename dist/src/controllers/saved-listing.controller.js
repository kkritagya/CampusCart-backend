"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSaved = listSaved;
exports.addSaved = addSaved;
exports.removeSaved = removeSaved;
const http_exception_1 = require("../exceptions/http-exception");
const saved_listing_service_1 = require("../services/saved-listing.service");
const apihelper_util_1 = require("../utils/apihelper.util");
function id(value) {
    return Array.isArray(value) ? value[0] : value;
}
function failure(res, error) {
    return (0, apihelper_util_1.sendResponse)(res, error instanceof http_exception_1.HttpException ? error.statusCode : 500, false, error instanceof Error ? error.message : "Saved items request failed");
}
async function listSaved(req, res) {
    try {
        if (!req.user)
            return (0, apihelper_util_1.sendResponse)(res, 401, false, "Unauthorized");
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Saved listings fetched successfully", await (0, saved_listing_service_1.getSavedListings)(req.user.id));
    }
    catch (error) {
        return failure(res, error);
    }
}
async function addSaved(req, res) {
    try {
        if (!req.user)
            return (0, apihelper_util_1.sendResponse)(res, 401, false, "Unauthorized");
        const listing = await (0, saved_listing_service_1.saveListing)(req.user.id, id(req.params.listingId));
        return (0, apihelper_util_1.sendResponse)(res, 201, true, "Listing saved successfully", listing);
    }
    catch (error) {
        return failure(res, error);
    }
}
async function removeSaved(req, res) {
    try {
        if (!req.user)
            return (0, apihelper_util_1.sendResponse)(res, 401, false, "Unauthorized");
        await (0, saved_listing_service_1.unsaveListing)(req.user.id, id(req.params.listingId));
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Listing removed from saved items");
    }
    catch (error) {
        return failure(res, error);
    }
}
