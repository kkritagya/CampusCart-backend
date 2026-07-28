"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markMessagesRead = exports.createMessageRecord = exports.countUnreadMessages = exports.findLatestMessage = exports.findMessagesForConversation = exports.touchConversation = exports.createConversationRecord = exports.findConversationForListing = exports.findConversationById = exports.findConversationsForUser = void 0;
const mongoose_1 = require("mongoose");
const conversation_model_1 = require("../models/conversation.model");
const message_model_1 = require("../models/message.model");
const findConversationsForUser = (userId) => conversation_model_1.ConversationModel.find({ participants: new mongoose_1.Types.ObjectId(userId) }).sort({
    updatedAt: -1,
});
exports.findConversationsForUser = findConversationsForUser;
const findConversationById = (id) => conversation_model_1.ConversationModel.findById(id);
exports.findConversationById = findConversationById;
const findConversationForListing = (listingId, firstUserId, secondUserId) => conversation_model_1.ConversationModel.findOne({
    listing: new mongoose_1.Types.ObjectId(listingId),
    participants: {
        $all: [new mongoose_1.Types.ObjectId(firstUserId), new mongoose_1.Types.ObjectId(secondUserId)],
    },
});
exports.findConversationForListing = findConversationForListing;
const createConversationRecord = (listingId, firstUserId, secondUserId) => conversation_model_1.ConversationModel.create({
    listing: new mongoose_1.Types.ObjectId(listingId),
    participants: [
        new mongoose_1.Types.ObjectId(firstUserId),
        new mongoose_1.Types.ObjectId(secondUserId),
    ],
});
exports.createConversationRecord = createConversationRecord;
const touchConversation = (id) => conversation_model_1.ConversationModel.findByIdAndUpdate(id, { updatedAt: new Date() }, { returnDocument: "after" });
exports.touchConversation = touchConversation;
const findMessagesForConversation = (conversationId) => message_model_1.MessageModel.find({ conversation: new mongoose_1.Types.ObjectId(conversationId) }).sort({
    createdAt: 1,
});
exports.findMessagesForConversation = findMessagesForConversation;
const findLatestMessage = (conversationId) => message_model_1.MessageModel.findOne({
    conversation: new mongoose_1.Types.ObjectId(conversationId),
}).sort({ createdAt: -1 });
exports.findLatestMessage = findLatestMessage;
const countUnreadMessages = (conversationId, userId) => message_model_1.MessageModel.countDocuments({
    conversation: new mongoose_1.Types.ObjectId(conversationId),
    sender: { $ne: new mongoose_1.Types.ObjectId(userId) },
    readBy: { $ne: new mongoose_1.Types.ObjectId(userId) },
});
exports.countUnreadMessages = countUnreadMessages;
const createMessageRecord = (conversationId, senderId, body) => message_model_1.MessageModel.create({
    conversation: new mongoose_1.Types.ObjectId(conversationId),
    sender: new mongoose_1.Types.ObjectId(senderId),
    body,
    readBy: [new mongoose_1.Types.ObjectId(senderId)],
});
exports.createMessageRecord = createMessageRecord;
const markMessagesRead = (conversationId, userId) => message_model_1.MessageModel.updateMany({
    conversation: new mongoose_1.Types.ObjectId(conversationId),
    sender: { $ne: new mongoose_1.Types.ObjectId(userId) },
    readBy: { $ne: new mongoose_1.Types.ObjectId(userId) },
}, { $addToSet: { readBy: new mongoose_1.Types.ObjectId(userId) } });
exports.markMessagesRead = markMessagesRead;
