import { Router } from "express";
import {
  addSaved,
  listSaved,
  removeSaved,
} from "../controllers/saved-listing.controller";
import { authorize } from "../middlewares/authorized.middleware";

const router = Router();
router.use(authorize);
router.get("/", listSaved);
router.post("/:listingId", addSaved);
router.delete("/:listingId", removeSaved);
export default router;
