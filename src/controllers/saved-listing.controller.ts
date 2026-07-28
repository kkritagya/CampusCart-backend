import { Response } from "express";
import { HttpException } from "../exceptions/http-exception";
import { AuthRequest } from "../middlewares/authorized.middleware";
import {
  getSavedListings,
  saveListing,
  unsaveListing,
} from "../services/saved-listing.service";
import { sendResponse } from "../utils/apihelper.util";

function id(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function failure(res: Response, error: unknown) {
  return sendResponse(
    res,
    error instanceof HttpException ? error.statusCode : 500,
    false,
    error instanceof Error ? error.message : "Saved items request failed"
  );
}

export async function listSaved(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendResponse(res, 401, false, "Unauthorized");
    return sendResponse(
      res,
      200,
      true,
      "Saved listings fetched successfully",
      await getSavedListings(req.user.id)
    );
  } catch (error) {
    return failure(res, error);
  }
}

export async function addSaved(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendResponse(res, 401, false, "Unauthorized");
    const listing = await saveListing(req.user.id, id(req.params.listingId));
    return sendResponse(res, 201, true, "Listing saved successfully", listing);
  } catch (error) {
    return failure(res, error);
  }
}

export async function removeSaved(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendResponse(res, 401, false, "Unauthorized");
    await unsaveListing(req.user.id, id(req.params.listingId));
    return sendResponse(res, 200, true, "Listing removed from saved items");
  } catch (error) {
    return failure(res, error);
  }
}
