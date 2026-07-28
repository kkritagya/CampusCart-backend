import { Router } from "express";
import { addCartItem, checkout, listCart, listPurchases, removeCartItem, sellerEarnings, verifyEsewa } from "../controllers/cart.controller";
import { authorize } from "../middlewares/authorized.middleware";

const router = Router();
router.use(authorize);
router.get("/", listCart);
router.get("/purchases", listPurchases);
router.get("/earnings", sellerEarnings);
router.post("/checkout", checkout);
router.post("/checkout/esewa/verify", verifyEsewa);
router.post("/:listingId", addCartItem);
router.delete("/:listingId", removeCartItem);
export default router;
