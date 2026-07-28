"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.createNotifications = createNotifications;
exports.getNotifications = getNotifications;
exports.markNotificationRead = markNotificationRead;
exports.markAllNotificationsRead = markAllNotificationsRead;
const mongoose_1 = require("mongoose");
const http_exception_1 = require("../exceptions/http-exception");
const notification_model_1 = require("../models/notification.model");
function createNotification(notification) {
    return notification_model_1.NotificationModel.create(notification);
}
function createNotifications(notifications) {
    return notifications.length
        ? notification_model_1.NotificationModel.insertMany(notifications)
        : Promise.resolve([]);
}
async function getNotifications(userId) {
    const notifications = await notification_model_1.NotificationModel.find({ recipient: userId })
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
async function markNotificationRead(notificationId, userId) {
    if (!(0, mongoose_1.isValidObjectId)(notificationId)) {
        throw new http_exception_1.HttpException(400, "Invalid notification ID");
    }
    const notification = await notification_model_1.NotificationModel.findOneAndUpdate({ _id: notificationId, recipient: userId }, { $set: { read: true } }, { returnDocument: "after" });
    if (!notification)
        throw new http_exception_1.HttpException(404, "Notification not found");
}
function markAllNotificationsRead(userId) {
    return notification_model_1.NotificationModel.updateMany({ recipient: userId, read: false }, { $set: { read: true } });
}
