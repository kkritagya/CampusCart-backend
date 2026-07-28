import { model, Schema, Types } from "mongoose";

export interface ISavedListingDocument {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  listing: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const savedListingSchema = new Schema<ISavedListingDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

savedListingSchema.index({ user: 1, listing: 1 }, { unique: true });

export const SavedListingModel = model<ISavedListingDocument>(
  "SavedListing",
  savedListingSchema
);
