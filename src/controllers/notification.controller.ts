import { Response } from "express";
import { AuthRequest } from "../middlewares/authorized.middleware";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notification.service";
import { sendResponse } from "../utils/apihelper.util";

const param = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value ?? "";

function handleError(res: Response, error: unknown) {
  const statusCode =
    error && typeof error === "object" && "statusCode" in error
      ? Number(error.statusCode)
      : 500;
  return sendResponse(
    res,
    statusCode,
    false,
    error instanceof Error ? error.message : "Notification request failed"
  );
}

export async function listNotifications(req: AuthRequest, res: Response) {
  try {
    return sendResponse(
      res,
      200,
      true,
      "Notifications fetched successfully",
      await getNotifications(req.user!.id)
    );
  } catch (error) {
    return handleError(res, error);
  }
}

export async function markOneRead(req: AuthRequest, res: Response) {
  try {
    await markNotificationRead(param(req.params.notificationId), req.user!.id);
    return sendResponse(res, 200, true, "Notification marked as read");
  } catch (error) {
    return handleError(res, error);
  }
}

export async function markAllRead(req: AuthRequest, res: Response) {
  try {
    await markAllNotificationsRead(req.user!.id);
    return sendResponse(res, 200, true, "Notifications marked as read");
  } catch (error) {
    return handleError(res, error);
  }
}
