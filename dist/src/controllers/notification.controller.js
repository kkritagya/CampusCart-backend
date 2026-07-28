"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listNotifications = listNotifications;
exports.markOneRead = markOneRead;
exports.markAllRead = markAllRead;
const notification_service_1 = require("../services/notification.service");
const apihelper_util_1 = require("../utils/apihelper.util");
const param = (value) => Array.isArray(value) ? value[0] : value ?? "";
function handleError(res, error) {
    const statusCode = error && typeof error === "object" && "statusCode" in error
        ? Number(error.statusCode)
        : 500;
    return (0, apihelper_util_1.sendResponse)(res, statusCode, false, error instanceof Error ? error.message : "Notification request failed");
}
async function listNotifications(req, res) {
    try {
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Notifications fetched successfully", await (0, notification_service_1.getNotifications)(req.user.id));
    }
    catch (error) {
        return handleError(res, error);
    }
}
async function markOneRead(req, res) {
    try {
        await (0, notification_service_1.markNotificationRead)(param(req.params.notificationId), req.user.id);
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Notification marked as read");
    }
    catch (error) {
        return handleError(res, error);
    }
}
async function markAllRead(req, res) {
    try {
        await (0, notification_service_1.markAllNotificationsRead)(req.user.id);
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Notifications marked as read");
    }
    catch (error) {
        return handleError(res, error);
    }
}
