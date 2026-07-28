import { Router } from "express";
import {
  approveAdminListing,
  deleteAdminListing,
  listAdminListings,
  rejectAdminListing,
} from "../controllers/admin-listing.controller";
import { authorize, requireAdmin, requireAdminSession } from "../middlewares/authorized.middleware";

const router = Router();
router.use(authorize, requireAdmin, requireAdminSession);
router.get("/", listAdminListings);
router.patch("/:id/approve", approveAdminListing);
router.patch("/:id/reject", rejectAdminListing);
router.delete("/:id", deleteAdminListing);

export default router;
