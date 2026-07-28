import { model, Schema } from "mongoose";
import {
  listingCampuses,
  listingCategories,
  listingConditions,
  listingStatuses,
  type IListingDocument,
} from "../types/listing.type";

const listingSchema = new Schema<IListingDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, required: true, trim: true, maxlength: 800 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, enum: listingCategories, required: true },
    condition: { type: String, enum: listingConditions, required: true },
    campus: { type: String, enum: listingCampuses, required: true },
    status: {
      type: String,
      enum: listingStatuses,
      default: "Active",
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
      required: true,
      index: true,
    },
    moderationReason: { type: String, trim: true, maxlength: 500 },
    moderatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    moderatedAt: { type: Date },
    tags: { type: [String], default: [] },
    images: { type: [String], default: [] },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    views: { type: Number, default: 0, min: 0 },
    enquiries: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

listingSchema.index({ title: "text", description: "text", tags: "text" });
listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ category: 1, condition: 1, campus: 1 });

export const ListingModel = model<IListingDocument>("Listing", listingSchema);
