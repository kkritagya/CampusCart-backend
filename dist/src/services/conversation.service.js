"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversations = getConversations;
exports.openConversation = openConversation;
exports.getMessages = getMessages;
exports.sendMessage = sendMessage;
exports.readConversation = readConversation;
const mongoose_1 = require("mongoose");
const http_exception_1 = require("../exceptions/http-exception");
const conversation_repository_1 = require("../repositories/conversation.repository");
const listing_repository_1 = require("../repositories/listing.repository");
const user_repository_1 = require("../repositories/user.repository");
const notification_service_1 = require("./notification.service");
function validId(id, label) {
    if (!(0, mongoose_1.isValidObjectId)(id))
        throw new http_exception_1.HttpException(400, `Invalid ${label} ID`);
}
async function requireParticipant(conversationId, userId) {
    validId(conversationId, "conversation");
    const conversation = await (0, conversation_repository_1.findConversationById)(conversationId);
    if (!conversation)
        throw new http_exception_1.HttpException(404, "Conversation not found");
    if (!conversation.participants.some((id) => id.toString() === userId)) {
        throw new http_exception_1.HttpException(403, "You are not part of this conversation");
    }
    return conversation;
}
async function conversationResponse(conversation, userId) {
    const otherId = conversation.participants.find((participant) => participant.toString() !== userId);
    const [listing, other, latestMessage, unreadCount] = await Promise.all([
        (0, listing_repository_1.findListingById)(conversation.listing.toString()),
        otherId ? (0, user_repository_1.findUserById)(otherId.toString()) : null,
        (0, conversation_repository_1.findLatestMessage)(conversation._id.toString()),
        (0, conversation_repository_1.countUnreadMessages)(conversation._id.toString(), userId),
    ]);
    return {
        id: conversation._id.toString(),
        listing: listing
            ? { id: listing._id.toString(), title: listing.title }
            : null,
        otherParticipant: other
            ? {
                id: other._id.toString(),
                fullName: other.fullName,
                profilePicture: other.profilePicture,
            }
            : null,
        lastMessage: latestMessage?.body ?? "",
        unreadCount,
        updatedAt: conversation.updatedAt,
    };
}
async function getConversations(userId) {
    const conversations = await (0, conversation_repository_1.findConversationsForUser)(userId);
    return Promise.all(conversations.map((item) => conversationResponse(item, userId)));
}
async function openConversation(userId, listingId) {
    validId(listingId, "listing");
    const listing = await (0, listing_repository_1.findListingById)(listingId);
    if (!listing ||
        listing.status === "Draft" ||
        listing.verificationStatus !== "Verified") {
        throw new http_exception_1.HttpException(404, "Listing not found");
    }
    const sellerId = listing.seller.toString();
    if (sellerId === userId) {
        throw new http_exception_1.HttpException(400, "You cannot message yourself about your listing");
    }
    const existing = await (0, conversation_repository_1.findConversationForListing)(listingId, userId, sellerId);
    const conversation = existing ?? (await (0, conversation_repository_1.createConversationRecord)(listingId, userId, sellerId));
    return conversationResponse(conversation, userId);
}
async function getMessages(conversationId, userId) {
    await requireParticipant(conversationId, userId);
    const messages = await (0, conversation_repository_1.findMessagesForConversation)(conversationId);
    return messages.map((message) => ({
        id: message._id.toString(),
        conversationId,
        senderId: message.sender.toString(),
        body: message.body,
        timestamp: message.createdAt,
        read: message.readBy.length > 1,
    }));
}
async function sendMessage(conversationId, userId, rawBody) {
    const conversation = await requireParticipant(conversationId, userId);
    const body = rawBody.trim();
    if (!body)
        throw new http_exception_1.HttpException(400, "Message cannot be empty");
    if (body.length > 1000) {
        throw new http_exception_1.HttpException(400, "Message cannot exceed 1000 characters");
    }
    const message = await (0, conversation_repository_1.createMessageRecord)(conversationId, userId, body);
    await (0, conversation_repository_1.touchConversation)(conversationId);
    const recipient = conversation.participants.find((participant) => participant.toString() !== userId);
    if (recipient) {
        const sender = await (0, user_repository_1.findUserById)(userId);
        await (0, notification_service_1.createNotification)({
            recipient,
            type: "message",
            title: `New message from ${sender?.fullName ?? "a CampusCart user"}`,
            body,
            href: `/messages/${conversationId}`,
        });
    }
    return {
        id: message._id.toString(),
        conversationId,
        senderId: userId,
        body: message.body,
        timestamp: message.createdAt,
        read: false,
    };
}
async function readConversation(conversationId, userId) {
    await requireParticipant(conversationId, userId);
    await (0, conversation_repository_1.markMessagesRead)(conversationId, userId);
}
