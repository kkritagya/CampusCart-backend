import { isValidObjectId, Types } from "mongoose";
import {
  CreateListingDto,
  ListingQueryDto,
  UpdateListingDto,
} from "../dtos/listing.dto";
import { HttpException } from "../exceptions/http-exception";
import {
  createListingRecord,
  deleteListingRecord,
  findListingById,
  findListings,
  findListingsBySeller,
  updateListingRecord,
} from "../repositories/listing.repository";
import { findUserById } from "../repositories/user.repository";
import {
  IListingDocument,
  ListingResponse,
} from "../types/listing.type";

export async function toListingResponse(
  listing: IListingDocument
): Promise<ListingResponse> {
  const seller = await findUserById(listing.seller.toString());
  if (!seller) throw new HttpException(500, "Listing seller could not be resolved");

  return {
    id: listing._id.toString(),
    title: listing.title,
    description: listing.description,
    price: listing.price,
    category: listing.category,
    condition: listing.condition,
    campus: listing.campus,
    status: listing.status,
    verificationStatus: listing.verificationStatus ?? "Pending",
    moderationReason: listing.moderationReason,
    moderatedAt: listing.moderatedAt,
    tags: listing.tags,
    images: listing.images,
    seller: {
      id: seller._id.toString(),
      fullName: seller.fullName,
      profilePicture: seller.profilePicture,
    },
    views: listing.views,
    enquiries: listing.enquiries,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
  };
}

function requireValidId(id: string) {
  if (!isValidObjectId(id)) throw new HttpException(400, "Invalid listing ID");
}

function requireOwnership(listing: IListingDocument, userId: string) {
  if (listing.seller.toString() !== userId) {
    throw new HttpException(403, "You can only manage your own listings");
  }
}

export async function createListing(userId: string, dto: CreateListingDto) {
  const listing = await createListingRecord({
    ...dto,
    verificationStatus: "Pending",
    seller: new Types.ObjectId(userId),
  });
  return toListingResponse(listing);
}

export async function getListings(query: ListingQueryDto) {
  const { items, total } = await findListings(query);
  return {
    items: await Promise.all(items.map(toListingResponse)),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getListing(id: string) {
  requireValidId(id);
  const listing = await findListingById(id);
  if (
    !listing ||
    listing.status === "Draft" ||
    listing.verificationStatus !== "Verified"
  ) {
    throw new HttpException(404, "Listing not found");
  }
  return toListingResponse(listing);
}

export async function getMyListings(userId: string) {
  const listings = await findListingsBySeller(userId);
  return Promise.all(listings.map(toListingResponse));
}

export async function updateListing(
  id: string,
  userId: string,
  dto: UpdateListingDto
) {
  requireValidId(id);
  const existing = await findListingById(id);
  if (!existing) throw new HttpException(404, "Listing not found");
  requireOwnership(existing, userId);
  const listing = await updateListingRecord(id, {
    ...dto,
    verificationStatus: "Pending",
    moderationReason: undefined,
    moderatedBy: undefined,
    moderatedAt: undefined,
  });
  if (!listing) throw new HttpException(404, "Listing not found");
  return toListingResponse(listing);
}

export async function deleteListing(id: string, userId: string) {
  requireValidId(id);
  const existing = await findListingById(id);
  if (!existing) throw new HttpException(404, "Listing not found");
  requireOwnership(existing, userId);
  await deleteListingRecord(id);
}
