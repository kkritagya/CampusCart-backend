import { Response } from "express";
import { HttpException } from "../exceptions/http-exception";
import { AuthRequest } from "../middlewares/authorized.middleware";
import {
  listModerationListings,
  moderateListing,
  removeModerationListing,
} from "../services/admin-listing.service";
import { sendResponse } from "../utils/apihelper.util";

const fail = (res: Response, error: unknown) =>
  sendResponse(
    res,
    error instanceof HttpException ? error.statusCode : 500,
    false,
    error instanceof Error ? error.message : "Listing moderation failed"
  );

export const listAdminListings = async (req: AuthRequest, res: Response) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    if (status && !["All", "Pending", "Verified", "Rejected"].includes(status)) {
      throw new HttpException(400, "Invalid verification status");
    }
    return sendResponse(res, 200, true, "Listings retrieved", await listModerationListings(status));
  } catch (error) { return fail(res, error); }
};

export const approveAdminListing = async (req: AuthRequest, res: Response) => {
  try {
    return sendResponse(res, 200, true, "Listing verified", await moderateListing(String(req.params.id), req.user!.id, "Verified"));
  } catch (error) { return fail(res, error); }
};

export const rejectAdminListing = async (req: AuthRequest, res: Response) => {
  try {
    return sendResponse(res, 200, true, "Listing rejected", await moderateListing(String(req.params.id), req.user!.id, "Rejected", req.body?.reason));
  } catch (error) { return fail(res, error); }
};

export const deleteAdminListing = async (req: AuthRequest, res: Response) => {
  try {
    await removeModerationListing(String(req.params.id));
    return res.status(204).send();
  } catch (error) { return fail(res, error); }
};
