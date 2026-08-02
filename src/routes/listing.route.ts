import { Router } from "express";
import {
  addListing,
  editListing,
  listListings,
  listMyListings,
  removeListing,
  showListing,
} from "../controllers/listing.controller";
import { authorize } from "../middlewares/authorized.middleware";
import { listingUpload } from "../middlewares/upload.middleware";
import { aiImageUpload } from "../middlewares/upload.middleware";
import { createListingSuggestion } from "../controllers/listing-ai.controller";

const router = Router();

router.get("/", listListings);
router.get("/mine", authorize, listMyListings);
router.post("/ai-suggest", authorize, aiImageUpload.single("image"), createListingSuggestion);
router.get("/:id", showListing);
router.post("/", authorize, listingUpload.array("images", 6), addListing);
router.put("/:id", authorize, listingUpload.array("images", 6), editListing);
router.delete("/:id", authorize, removeListing);

export default router;
