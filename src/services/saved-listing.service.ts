import { isValidObjectId } from "mongoose";
import { HttpException } from "../exceptions/http-exception";
import { findListingById } from "../repositories/listing.repository";
import {
  createSavedEntry,
  deleteSavedEntry,
  findSavedByUser,
  findSavedEntry,
} from "../repositories/saved-listing.repository";
import { toListingResponse } from "./listing.service";
import { createNotification } from "./notification.service";

function validateListingId(id: string) {
  if (!isValidObjectId(id)) throw new HttpException(400, "Invalid listing ID");
}

export async function getSavedListings(userId: string) {
  const entries = await findSavedByUser(userId);
  const listings = await Promise.all(
    entries.map((entry) => findListingById(entry.listing.toString()))
  );
  return Promise.all(
    listings
      .filter(
        (listing) =>
          listing &&
          listing.status !== "Draft" &&
          listing.verificationStatus === "Verified"
      )
      .map((listing) => toListingResponse(listing!))
  );
}

export async function saveListing(userId: string, listingId: string) {
  validateListingId(listingId);
  const listing = await findListingById(listingId);
  if (
    !listing ||
    listing.status === "Draft" ||
    listing.verificationStatus !== "Verified"
  ) {
    throw new HttpException(404, "Listing not found");
  }
  const existing = await findSavedEntry(userId, listingId);
  await createSavedEntry(userId, listingId);
  if (!existing) {
    await createNotification({
      recipient: userId,
      type: "saved",
      title: "Item saved",
      body: `${listing.title} was added to your saved items.`,
      href: "/saved",
    });
  }
  return toListingResponse(listing);
}

export async function unsaveListing(userId: string, listingId: string) {
  validateListingId(listingId);
  const entry = await findSavedEntry(userId, listingId);
  if (!entry) throw new HttpException(404, "Saved listing not found");
  await deleteSavedEntry(userId, listingId);
}
