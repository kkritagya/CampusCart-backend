"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listingQuerySchema = exports.updateListingSchema = exports.createListingSchema = void 0;
exports.formatZodError = formatZodError;
const zod_1 = require("zod");
const listing_type_1 = require("../types/listing.type");
const listingFields = {
    title: zod_1.z.string().trim().min(3).max(80),
    description: zod_1.z.string().trim().min(20).max(800),
    price: zod_1.z.coerce.number().positive().max(100000000),
    category: zod_1.z.enum(listing_type_1.listingCategories),
    condition: zod_1.z.enum(listing_type_1.listingConditions),
    campus: zod_1.z.enum(listing_type_1.listingCampuses),
    status: zod_1.z.enum(listing_type_1.listingStatuses),
    tags: zod_1.z.array(zod_1.z.string().trim().min(1).max(30)).max(10),
    images: zod_1.z.array(zod_1.z.string().trim().min(1).max(500)).max(6),
};
exports.createListingSchema = zod_1.z.object({
    ...listingFields,
    status: listingFields.status.default("Active"),
    tags: listingFields.tags.default([]),
    images: listingFields.images.default([]),
});
exports.updateListingSchema = zod_1.z
    .object(listingFields)
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
});
exports.listingQuerySchema = zod_1.z.object({
    search: zod_1.z.string().trim().max(100).optional(),
    category: zod_1.z.enum(listing_type_1.listingCategories).optional(),
    condition: zod_1.z.enum(listing_type_1.listingConditions).optional(),
    campus: zod_1.z.enum(listing_type_1.listingCampuses).optional(),
    status: zod_1.z.enum(["Active", "Sold"]).default("Active"),
    minPrice: zod_1.z.coerce.number().nonnegative().optional(),
    maxPrice: zod_1.z.coerce.number().nonnegative().optional(),
    sort: zod_1.z.enum(["newest", "oldest", "price-asc", "price-desc"]).default("newest"),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(50).default(12),
});
function formatZodError(error) {
    return error.issues
        .map((issue) => `${issue.path.join(".") || "request"}: ${issue.message}`)
        .join("; ");
}
