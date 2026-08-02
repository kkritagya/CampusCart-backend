import { isValidObjectId, Types } from "mongoose";
import { HttpException } from "../exceptions/http-exception";
import { NotificationModel } from "../models/notification.model";

export type NewNotification = {
  recipient: string | Types.ObjectId;
  type: "message" | "sale" | "moderation" | "saved" | "cart" | "purchase";
  title: string;
  body: string;
  href: string;
};

export function createNotification(notification: NewNotification) {
  return NotificationModel.create(notification);
}

export function createNotifications(notifications: NewNotification[]) {
  return notifications.length
    ? NotificationModel.insertMany(notifications)
    : Promise.resolve([]);
}

export async function getNotifications(userId: string) {
  const notifications = await NotificationModel.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return notifications.map((notification) => ({
    id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    body: notification.body,
    href: notification.href,
    read: notification.read,
    createdAt: notification.createdAt,
  }));
}

export async function markNotificationRead(notificationId: string, userId: string) {
  if (!isValidObjectId(notificationId)) {
    throw new HttpException(400, "Invalid notification ID");
  }
  const notification = await NotificationModel.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { $set: { read: true } },
    { returnDocument: "after" }
  );
  if (!notification) throw new HttpException(404, "Notification not found");
}

export function markAllNotificationsRead(userId: string) {
  return NotificationModel.updateMany(
    { recipient: userId, read: false },
    { $set: { read: true } }
  );
}
