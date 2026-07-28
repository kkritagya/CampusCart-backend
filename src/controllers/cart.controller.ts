import { Response } from "express";
import { HttpException } from "../exceptions/http-exception";
import { AuthRequest } from "../middlewares/authorized.middleware";
import { addToCart, checkoutCart, getCart, getPurchasedOrders, getSellerEarnings, removeFromCart, verifyEsewaPayment } from "../services/cart.service";
import { sendResponse } from "../utils/apihelper.util";

function failure(res: Response, error: unknown) {
  return sendResponse(res, error instanceof HttpException ? error.statusCode : 500, false, error instanceof Error ? error.message : "Cart request failed");
}

export async function listCart(req: AuthRequest, res: Response) {
  try { return sendResponse(res, 200, true, "Cart fetched successfully", await getCart(req.user!.id)); }
  catch (error) { return failure(res, error); }
}
export async function listPurchases(req: AuthRequest, res: Response) {
  try { return sendResponse(res, 200, true, "Purchases fetched successfully", await getPurchasedOrders(req.user!.id)); }
  catch (error) { return failure(res, error); }
}
export async function sellerEarnings(req: AuthRequest, res: Response) {
  try { return sendResponse(res, 200, true, "Seller earnings fetched successfully", await getSellerEarnings(req.user!.id)); }
  catch (error) { return failure(res, error); }
}
export async function addCartItem(req: AuthRequest, res: Response) {
  try { return sendResponse(res, 201, true, "Listing added to cart", await addToCart(req.user!.id, String(req.params.listingId))); }
  catch (error) { return failure(res, error); }
}
export async function removeCartItem(req: AuthRequest, res: Response) {
  try { return sendResponse(res, 200, true, "Listing removed from cart", await removeFromCart(req.user!.id, String(req.params.listingId))); }
  catch (error) { return failure(res, error); }
}
export async function checkout(req: AuthRequest, res: Response) {
  try { return sendResponse(res, 201, true, "eSewa payment initialized", await checkoutCart(req.user!.id, req.body?.billingAddress)); }
  catch (error) { return failure(res, error); }
}
export async function verifyEsewa(req: AuthRequest, res: Response) {
  try { return sendResponse(res, 200, true, "eSewa payment verified", await verifyEsewaPayment(req.user!.id, req.body?.data)); }
  catch (error) { return failure(res, error); }
}
