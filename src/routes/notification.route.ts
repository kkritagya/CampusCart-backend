import { Router } from "express";
import {
  listNotifications,
  markAllRead,
  markOneRead,
} from "../controllers/notification.controller";
import { authorize } from "../middlewares/authorized.middleware";

const router = Router();
router.use(authorize);
router.get("/", listNotifications);
router.patch("/read", markAllRead);
router.patch("/:notificationId/read", markOneRead);

export default router;
