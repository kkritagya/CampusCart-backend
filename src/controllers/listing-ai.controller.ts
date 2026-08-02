import { Response } from "express";
import { AuthRequest } from "../middlewares/authorized.middleware";
import { HttpException } from "../exceptions/http-exception";
import { suggestListing } from "../services/listing-ai.service";
import { sendResponse } from "../utils/apihelper.util";

export async function createListingSuggestion(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendResponse(res, 401, false, "Unauthorized");
    if (!req.file) return sendResponse(res, 400, false, "A product image is required");
    const language = req.body.language === "ne" ? "ne" : "en";
    const suggestion = await suggestListing(req.file, language);
    return sendResponse(res, 200, true, "Listing suggestion generated", suggestion);
  } catch (error) {
    const status = error instanceof HttpException ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : "Failed to generate listing suggestion";
    return sendResponse(res, status, false, message);
  }
}
