"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSavedEntry = exports.createSavedEntry = exports.findSavedEntry = exports.findSavedByUser = void 0;
const mongoose_1 = require("mongoose");
const saved_listing_model_1 = require("../models/saved-listing.model");
const findSavedByUser = (userId) => saved_listing_model_1.SavedListingModel.find({ user: new mongoose_1.Types.ObjectId(userId) }).sort({
    createdAt: -1,
});
exports.findSavedByUser = findSavedByUser;
const findSavedEntry = (userId, listingId) => saved_listing_model_1.SavedListingModel.findOne({
    user: new mongoose_1.Types.ObjectId(userId),
    listing: new mongoose_1.Types.ObjectId(listingId),
});
exports.findSavedEntry = findSavedEntry;
const createSavedEntry = (userId, listingId) => saved_listing_model_1.SavedListingModel.findOneAndUpdate({
    user: new mongoose_1.Types.ObjectId(userId),
    listing: new mongoose_1.Types.ObjectId(listingId),
}, {
    $setOnInsert: {
        user: new mongoose_1.Types.ObjectId(userId),
        listing: new mongoose_1.Types.ObjectId(listingId),
    },
}, { upsert: true, returnDocument: "after" });
exports.createSavedEntry = createSavedEntry;
const deleteSavedEntry = (userId, listingId) => saved_listing_model_1.SavedListingModel.findOneAndDelete({
    user: new mongoose_1.Types.ObjectId(userId),
    listing: new mongoose_1.Types.ObjectId(listingId),
});
exports.deleteSavedEntry = deleteSavedEntry;
