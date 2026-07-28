"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteListingRecord = exports.updateListingRecord = exports.findListingById = exports.findListingsBySeller = exports.findListings = exports.createListingRecord = void 0;
const mongoose_1 = require("mongoose");
const listing_model_1 = require("../models/listing.model");
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function buildFilter(query) {
    const filter = {
        status: query.status,
        verificationStatus: "Verified",
    };
    if (query.search) {
        const expression = new RegExp(escapeRegex(query.search), "i");
        filter.$or = [
            { title: expression },
            { description: expression },
            { tags: expression },
        ];
    }
    if (query.category)
        filter.category = query.category;
    if (query.condition)
        filter.condition = query.condition;
    if (query.campus)
        filter.campus = query.campus;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
        filter.price = {
            ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}),
            ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}),
        };
    }
    return filter;
}
function buildSort(sort) {
    if (sort === "oldest")
        return { createdAt: 1 };
    if (sort === "price-asc")
        return { price: 1, createdAt: -1 };
    if (sort === "price-desc")
        return { price: -1, createdAt: -1 };
    return { createdAt: -1 };
}
const createListingRecord = (listing) => listing_model_1.ListingModel.create(listing);
exports.createListingRecord = createListingRecord;
const findListings = async (query) => {
    const filter = buildFilter(query);
    const [items, total] = await Promise.all([
        listing_model_1.ListingModel.find(filter)
            .sort(buildSort(query.sort))
            .skip((query.page - 1) * query.limit)
            .limit(query.limit),
        listing_model_1.ListingModel.countDocuments(filter),
    ]);
    return { items, total };
};
exports.findListings = findListings;
const findListingsBySeller = (sellerId) => listing_model_1.ListingModel.find({ seller: new mongoose_1.Types.ObjectId(sellerId) }).sort({
    createdAt: -1,
});
exports.findListingsBySeller = findListingsBySeller;
const findListingById = (id) => listing_model_1.ListingModel.findById(id);
exports.findListingById = findListingById;
const updateListingRecord = (id, update) => listing_model_1.ListingModel.findByIdAndUpdate(id, update, {
    returnDocument: "after",
    runValidators: true,
});
exports.updateListingRecord = updateListingRecord;
const deleteListingRecord = (id) => listing_model_1.ListingModel.findByIdAndDelete(id);
exports.deleteListingRecord = deleteListingRecord;
