import { z } from "zod";
import {
  listingCampuses,
  listingCategories,
  listingConditions,
  listingStatuses,
} from "../types/listing.type";

const listingFields = {
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().min(20).max(800),
  price: z.coerce.number().positive().max(100_000_000),
  category: z.enum(listingCategories),
  condition: z.enum(listingConditions),
  campus: z.enum(listingCampuses),
  status: z.enum(listingStatuses),
  tags: z.array(z.string().trim().min(1).max(30)).max(10),
  images: z.array(z.string().trim().min(1).max(500)).max(6),
};

export const createListingSchema = z.object({
  ...listingFields,
  status: listingFields.status.default("Active"),
  tags: listingFields.tags.default([]),
  images: listingFields.images.default([]),
});

export const updateListingSchema = z
  .object(listingFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

export const listingQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.enum(listingCategories).optional(),
  condition: z.enum(listingConditions).optional(),
  campus: z.enum(listingCampuses).optional(),
  status: z.enum(["Active", "Sold"]).default("Active"),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sort: z.enum(["newest", "oldest", "price-asc", "price-desc"]).default("newest"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

export type CreateListingDto = z.infer<typeof createListingSchema>;
export type UpdateListingDto = z.infer<typeof updateListingSchema>;
export type ListingQueryDto = z.infer<typeof listingQuerySchema>;

export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "request"}: ${issue.message}`)
    .join("; ");
}
