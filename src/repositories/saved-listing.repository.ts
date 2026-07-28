import { Types } from "mongoose";
import { SavedListingModel } from "../models/saved-listing.model";

export const findSavedByUser = (userId: string) =>
  SavedListingModel.find({ user: new Types.ObjectId(userId) }).sort({
    createdAt: -1,
  });

export const findSavedEntry = (userId: string, listingId: string) =>
  SavedListingModel.findOne({
    user: new Types.ObjectId(userId),
    listing: new Types.ObjectId(listingId),
  });

export const createSavedEntry = (userId: string, listingId: string) =>
  SavedListingModel.findOneAndUpdate(
    {
      user: new Types.ObjectId(userId),
      listing: new Types.ObjectId(listingId),
    },
    {
      $setOnInsert: {
        user: new Types.ObjectId(userId),
        listing: new Types.ObjectId(listingId),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

export const deleteSavedEntry = (userId: string, listingId: string) =>
  SavedListingModel.findOneAndDelete({
    user: new Types.ObjectId(userId),
    listing: new Types.ObjectId(listingId),
  });
