import { Response } from "express";
import { HttpException } from "../exceptions/http-exception";
import { AuthRequest } from "../middlewares/authorized.middleware";
import {
  getConversations,
  getMessages,
  openConversation,
  readConversation,
  sendMessage,
} from "../services/conversation.service";
import { sendResponse } from "../utils/apihelper.util";

function param(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function failure(res: Response, error: unknown) {
  return sendResponse(
    res,
    error instanceof HttpException ? error.statusCode : 500,
    false,
    error instanceof Error ? error.message : "Messaging request failed"
  );
}

export async function listConversations(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendResponse(res, 401, false, "Unauthorized");
    return sendResponse(
      res,
      200,
      true,
      "Conversations fetched successfully",
      await getConversations(req.user.id)
    );
  } catch (error) {
    return failure(res, error);
  }
}

export async function createConversation(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendResponse(res, 401, false, "Unauthorized");
    if (typeof req.body?.listingId !== "string") {
      return sendResponse(res, 400, false, "listingId is required");
    }
    const conversation = await openConversation(req.user.id, req.body.listingId);
    return sendResponse(res, 201, true, "Conversation ready", conversation);
  } catch (error) {
    return failure(res, error);
  }
}

export async function listMessages(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendResponse(res, 401, false, "Unauthorized");
    const messages = await getMessages(
      param(req.params.conversationId),
      req.user.id
    );
    return sendResponse(res, 200, true, "Messages fetched successfully", messages);
  } catch (error) {
    return failure(res, error);
  }
}

export async function addMessage(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendResponse(res, 401, false, "Unauthorized");
    if (typeof req.body?.body !== "string") {
      return sendResponse(res, 400, false, "Message body is required");
    }
    const message = await sendMessage(
      param(req.params.conversationId),
      req.user.id,
      req.body.body
    );
    return sendResponse(res, 201, true, "Message sent successfully", message);
  } catch (error) {
    return failure(res, error);
  }
}

export async function markRead(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return sendResponse(res, 401, false, "Unauthorized");
    await readConversation(param(req.params.conversationId), req.user.id);
    return sendResponse(res, 200, true, "Conversation marked as read");
  } catch (error) {
    return failure(res, error);
  }
}
