"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listConversations = listConversations;
exports.createConversation = createConversation;
exports.listMessages = listMessages;
exports.addMessage = addMessage;
exports.markRead = markRead;
const http_exception_1 = require("../exceptions/http-exception");
const conversation_service_1 = require("../services/conversation.service");
const apihelper_util_1 = require("../utils/apihelper.util");
function param(value) {
    return Array.isArray(value) ? value[0] : value;
}
function failure(res, error) {
    return (0, apihelper_util_1.sendResponse)(res, error instanceof http_exception_1.HttpException ? error.statusCode : 500, false, error instanceof Error ? error.message : "Messaging request failed");
}
async function listConversations(req, res) {
    try {
        if (!req.user)
            return (0, apihelper_util_1.sendResponse)(res, 401, false, "Unauthorized");
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Conversations fetched successfully", await (0, conversation_service_1.getConversations)(req.user.id));
    }
    catch (error) {
        return failure(res, error);
    }
}
async function createConversation(req, res) {
    try {
        if (!req.user)
            return (0, apihelper_util_1.sendResponse)(res, 401, false, "Unauthorized");
        if (typeof req.body?.listingId !== "string") {
            return (0, apihelper_util_1.sendResponse)(res, 400, false, "listingId is required");
        }
        const conversation = await (0, conversation_service_1.openConversation)(req.user.id, req.body.listingId);
        return (0, apihelper_util_1.sendResponse)(res, 201, true, "Conversation ready", conversation);
    }
    catch (error) {
        return failure(res, error);
    }
}
async function listMessages(req, res) {
    try {
        if (!req.user)
            return (0, apihelper_util_1.sendResponse)(res, 401, false, "Unauthorized");
        const messages = await (0, conversation_service_1.getMessages)(param(req.params.conversationId), req.user.id);
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Messages fetched successfully", messages);
    }
    catch (error) {
        return failure(res, error);
    }
}
async function addMessage(req, res) {
    try {
        if (!req.user)
            return (0, apihelper_util_1.sendResponse)(res, 401, false, "Unauthorized");
        if (typeof req.body?.body !== "string") {
            return (0, apihelper_util_1.sendResponse)(res, 400, false, "Message body is required");
        }
        const message = await (0, conversation_service_1.sendMessage)(param(req.params.conversationId), req.user.id, req.body.body);
        return (0, apihelper_util_1.sendResponse)(res, 201, true, "Message sent successfully", message);
    }
    catch (error) {
        return failure(res, error);
    }
}
async function markRead(req, res) {
    try {
        if (!req.user)
            return (0, apihelper_util_1.sendResponse)(res, 401, false, "Unauthorized");
        await (0, conversation_service_1.readConversation)(param(req.params.conversationId), req.user.id);
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Conversation marked as read");
    }
    catch (error) {
        return failure(res, error);
    }
}
