"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAdminListing = exports.rejectAdminListing = exports.approveAdminListing = exports.listAdminListings = void 0;
const http_exception_1 = require("../exceptions/http-exception");
const admin_listing_service_1 = require("../services/admin-listing.service");
const apihelper_util_1 = require("../utils/apihelper.util");
const fail = (res, error) => (0, apihelper_util_1.sendResponse)(res, error instanceof http_exception_1.HttpException ? error.statusCode : 500, false, error instanceof Error ? error.message : "Listing moderation failed");
const listAdminListings = async (req, res) => {
    try {
        const status = typeof req.query.status === "string" ? req.query.status : undefined;
        if (status && !["All", "Pending", "Verified", "Rejected"].includes(status)) {
            throw new http_exception_1.HttpException(400, "Invalid verification status");
        }
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Listings retrieved", await (0, admin_listing_service_1.listModerationListings)(status));
    }
    catch (error) {
        return fail(res, error);
    }
};
exports.listAdminListings = listAdminListings;
const approveAdminListing = async (req, res) => {
    try {
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Listing verified", await (0, admin_listing_service_1.moderateListing)(String(req.params.id), req.user.id, "Verified"));
    }
    catch (error) {
        return fail(res, error);
    }
};
exports.approveAdminListing = approveAdminListing;
const rejectAdminListing = async (req, res) => {
    try {
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Listing rejected", await (0, admin_listing_service_1.moderateListing)(String(req.params.id), req.user.id, "Rejected", req.body?.reason));
    }
    catch (error) {
        return fail(res, error);
    }
};
exports.rejectAdminListing = rejectAdminListing;
const deleteAdminListing = async (req, res) => {
    try {
        await (0, admin_listing_service_1.removeModerationListing)(String(req.params.id));
        return res.status(204).send();
    }
    catch (error) {
        return fail(res, error);
    }
};
exports.deleteAdminListing = deleteAdminListing;
