import { Request, Response } from "express";
import {
  createListingSchema,
  formatZodError,
  listingQuerySchema,
  updateListingSchema,
} from "../dtos/listing.dto";
import { HttpException } from "../exceptions/http-exception";
import { AuthRequest } from "../middlewares/authorized.middleware";
import {
  createListing,
  deleteListing,
  getListing,
  getListings,
  getMyListings,
  updateListing,
} from "../services/listing.service";
import { sendResponse } from "../utils/apihelper.util";

function sendControllerError(res: Response, error: unknown, fallback: string) {
  const statusCode = error instanceof HttpException ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : fallback;
  return sendResponse(res, statusCode, false, message);
}

function routeId(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function uploadedImagePaths(req: AuthRequest) {
  const files = Array.isArray(req.files) ? req.files : [];
  return files.map((file) => `/uploads/listings/${file.filename}`);
}

function normalizeListingBody(req: AuthRequest, includeImages: boolean) {
  const body = { ...req.body } as Record<string, unknown>;
  if (typeof body.tags === "string") {
    const tags = body.tags;
    try {
      const parsed: unknown = JSON.parse(tags);
      body.tags = Array.isArray(parsed) ? parsed : [];
    } catch {
      body.tags = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
  }
  const images = uploadedImagePaths(req);
  if (includeImages || images.length > 0) body.images = images;
  return body;
}

export async function listListings(req: Request, res: Response) {
  try {
    const parsed = listingQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return sendResponse(res, 400, false, formatZodError(parsed.error));
    }
    const result = await getListings(parsed.data);
    return sendResponse(res, 200, true, "Listings fetched successfully", result);
  } catch (error) {
    return sendControllerError(res, error, "Failed to fetch listings");
  }
}

export async function showListing(req: Request, res: Response) {
  try {
    const listing = await getListing(routeId(req.params.id));
    return sendResponse(res, 200, true, "Listing fetched successfully", listing);
  } catch (error) {
    return sendControllerError(res, error, "Failed to fetch listing");
  }
}

export async function listMyListings(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendResponse(res, 401, false, "Unauthorized");
    const listings = await getMyListings(req.user.id);
    return sendResponse(res, 200, true, "Your listings fetched successfully", listings);
  } catch (error) {
    return sendControllerError(res, error, "Failed to fetch your listings");
  }
}

export async function addListing(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendResponse(res, 401, false, "Unauthorized");
    const parsed = createListingSchema.safeParse(normalizeListingBody(req, true));
    if (!parsed.success) {
      return sendResponse(res, 400, false, formatZodError(parsed.error));
    }
    const listing = await createListing(req.user.id, parsed.data);
    res.location(`/api/v1/listings/${listing.id}`);
    return sendResponse(res, 201, true, "Listing submitted for admin verification", listing);
  } catch (error) {
    return sendControllerError(res, error, "Failed to create listing");
  }
}

export async function editListing(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendResponse(res, 401, false, "Unauthorized");
    const parsed = updateListingSchema.safeParse(normalizeListingBody(req, false));
    if (!parsed.success) {
      return sendResponse(res, 400, false, formatZodError(parsed.error));
    }
    const listing = await updateListing(routeId(req.params.id), req.user.id, parsed.data);
    return sendResponse(res, 200, true, "Listing updated and submitted for admin verification", listing);
  } catch (error) {
    return sendControllerError(res, error, "Failed to update listing");
  }
}

export async function removeListing(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendResponse(res, 401, false, "Unauthorized");
    await deleteListing(routeId(req.params.id), req.user.id);
    return sendResponse(res, 200, true, "Listing deleted successfully");
  } catch (error) {
    return sendControllerError(res, error, "Failed to delete listing");
  }
}
