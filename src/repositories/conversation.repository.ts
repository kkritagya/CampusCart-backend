import { Types } from "mongoose";
import { ConversationModel } from "../models/conversation.model";
import { MessageModel } from "../models/message.model";

export const findConversationsForUser = (userId: string) =>
  ConversationModel.find({ participants: new Types.ObjectId(userId) }).sort({
    updatedAt: -1,
  });

export const findConversationById = (id: string) =>
  ConversationModel.findById(id);

export const findConversationForListing = (
  listingId: string,
  firstUserId: string,
  secondUserId: string
) =>
  ConversationModel.findOne({
    listing: new Types.ObjectId(listingId),
    participants: {
      $all: [new Types.ObjectId(firstUserId), new Types.ObjectId(secondUserId)],
    },
  });

export const createConversationRecord = (
  listingId: string,
  firstUserId: string,
  secondUserId: string
) =>
  ConversationModel.create({
    listing: new Types.ObjectId(listingId),
    participants: [
      new Types.ObjectId(firstUserId),
      new Types.ObjectId(secondUserId),
    ],
  });

export const touchConversation = (id: string) =>
  ConversationModel.findByIdAndUpdate(
    id,
    { updatedAt: new Date() },
    { returnDocument: "after" }
  );

export const findMessagesForConversation = (conversationId: string) =>
  MessageModel.find({ conversation: new Types.ObjectId(conversationId) }).sort({
    createdAt: 1,
  });

export const findLatestMessage = (conversationId: string) =>
  MessageModel.findOne({
    conversation: new Types.ObjectId(conversationId),
  }).sort({ createdAt: -1 });

export const countUnreadMessages = (conversationId: string, userId: string) =>
  MessageModel.countDocuments({
    conversation: new Types.ObjectId(conversationId),
    sender: { $ne: new Types.ObjectId(userId) },
    readBy: { $ne: new Types.ObjectId(userId) },
  });

export const createMessageRecord = (
  conversationId: string,
  senderId: string,
  body: string
) =>
  MessageModel.create({
    conversation: new Types.ObjectId(conversationId),
    sender: new Types.ObjectId(senderId),
    body,
    readBy: [new Types.ObjectId(senderId)],
  });

export const markMessagesRead = (conversationId: string, userId: string) =>
  MessageModel.updateMany(
    {
      conversation: new Types.ObjectId(conversationId),
      sender: { $ne: new Types.ObjectId(userId) },
      readBy: { $ne: new Types.ObjectId(userId) },
    },
    { $addToSet: { readBy: new Types.ObjectId(userId) } }
  );
