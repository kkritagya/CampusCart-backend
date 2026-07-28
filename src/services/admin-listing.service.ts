import { Types, isValidObjectId } from "mongoose";
import { HttpException } from "../exceptions/http-exception";
import { CartModel } from "../models/cart.model";
import { ListingModel } from "../models/listing.model";
import { SavedListingModel } from "../models/saved-listing.model";
import { toListingResponse } from "./listing.service";
import { createNotification } from "./notification.service";

const validId = (id: string) => {
  if (!isValidObjectId(id)) throw new HttpException(400, "Invalid listing ID");
};

export async function listModerationListings(status?: string) {
  const filter: { verificationStatus?: "Pending" | "Verified" | "Rejected" } = {};
  if (status && status !== "All") {
    filter.verificationStatus = status as "Pending" | "Verified" | "Rejected";
  }
  const listings = await ListingModel.find(filter).sort({ createdAt: -1 }).limit(200);
  return Promise.all(listings.map(toListingResponse));
}

export async function moderateListing(
  id: string,
  adminId: string,
  verificationStatus: "Verified" | "Rejected",
  reason?: string
) {
  validId(id);
  if (verificationStatus === "Rejected" && !reason?.trim()) {
    throw new HttpException(400, "A rejection reason is required");
  }
  const listing = await ListingModel.findByIdAndUpdate(
    id,
    {
      verificationStatus,
      moderationReason: verificationStatus === "Rejected" ? reason!.trim() : undefined,
      moderatedBy: new Types.ObjectId(adminId),
      moderatedAt: new Date(),
    },
    { new: true, runValidators: true }
  );
  if (!listing) throw new HttpException(404, "Listing not found");

  await createNotification({
    recipient: listing.seller,
    type: "moderation",
    title:
      verificationStatus === "Verified"
        ? "Listing approved"
        : "Listing needs changes",
    body:
      verificationStatus === "Verified"
        ? `Your listing “${listing.title}” is now live in the marketplace.`
        : `Your listing “${listing.title}” was rejected: ${reason!.trim()}`,
    href:
      verificationStatus === "Verified"
        ? `/marketplace/${listing._id}`
        : `/dashboard/listings/${listing._id}/edit`,
  });

  return toListingResponse(listing);
}

export async function removeModerationListing(id: string) {
  validId(id);
  const listing = await ListingModel.findByIdAndDelete(id);
  if (!listing) throw new HttpException(404, "Listing not found");
  await Promise.all([
    SavedListingModel.deleteMany({ listing: listing._id }),
    CartModel.updateMany({}, { $pull: { listings: listing._id } }),
  ]);
}
