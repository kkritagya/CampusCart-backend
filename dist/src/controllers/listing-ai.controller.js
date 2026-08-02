"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createListingSuggestion = createListingSuggestion;
const http_exception_1 = require("../exceptions/http-exception");
const listing_ai_service_1 = require("../services/listing-ai.service");
const apihelper_util_1 = require("../utils/apihelper.util");
async function createListingSuggestion(req, res) {
    try {
        if (!req.user)
            return (0, apihelper_util_1.sendResponse)(res, 401, false, "Unauthorized");
        if (!req.file)
            return (0, apihelper_util_1.sendResponse)(res, 400, false, "A product image is required");
        const language = req.body.language === "ne" ? "ne" : "en";
        const suggestion = await (0, listing_ai_service_1.suggestListing)(req.file, language);
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Listing suggestion generated", suggestion);
    }
    catch (error) {
        const status = error instanceof http_exception_1.HttpException ? error.statusCode : 500;
        const message = error instanceof Error ? error.message : "Failed to generate listing suggestion";
        return (0, apihelper_util_1.sendResponse)(res, status, false, message);
    }
}
