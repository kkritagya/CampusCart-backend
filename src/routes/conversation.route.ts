import { Router } from "express";
import {
  addMessage,
  createConversation,
  listConversations,
  listMessages,
  markRead,
} from "../controllers/conversation.controller";
import { authorize } from "../middlewares/authorized.middleware";

const router = Router();
router.use(authorize);
router.get("/", listConversations);
router.post("/", createConversation);
router.get("/:conversationId/messages", listMessages);
router.post("/:conversationId/messages", addMessage);
router.patch("/:conversationId/read", markRead);
export default router;
