import { isValidObjectId } from "mongoose";
import { HttpException } from "../exceptions/http-exception";
import {
  countUnreadMessages,
  createConversationRecord,
  createMessageRecord,
  findConversationById,
  findConversationForListing,
  findConversationsForUser,
  findLatestMessage,
  findMessagesForConversation,
  markMessagesRead,
  touchConversation,
} from "../repositories/conversation.repository";
import { findListingById } from "../repositories/listing.repository";
import { findUserById } from "../repositories/user.repository";
import { createNotification } from "./notification.service";

function validId(id: string, label: string) {
  if (!isValidObjectId(id)) throw new HttpException(400, `Invalid ${label} ID`);
}

async function requireParticipant(conversationId: string, userId: string) {
  validId(conversationId, "conversation");
  const conversation = await findConversationById(conversationId);
  if (!conversation) throw new HttpException(404, "Conversation not found");
  if (!conversation.participants.some((id) => id.toString() === userId)) {
    throw new HttpException(403, "You are not part of this conversation");
  }
  return conversation;
}

async function conversationResponse(
  conversation: Awaited<ReturnType<typeof findConversationById>> extends infer T
    ? NonNullable<T>
    : never,
  userId: string
) {
  const otherId = conversation.participants.find(
    (participant) => participant.toString() !== userId
  );
  const [listing, other, latestMessage, unreadCount] = await Promise.all([
    findListingById(conversation.listing.toString()),
    otherId ? findUserById(otherId.toString()) : null,
    findLatestMessage(conversation._id.toString()),
    countUnreadMessages(conversation._id.toString(), userId),
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

export async function getConversations(userId: string) {
  const conversations = await findConversationsForUser(userId);
  return Promise.all(conversations.map((item) => conversationResponse(item, userId)));
}

export async function openConversation(userId: string, listingId: string) {
  validId(listingId, "listing");
  const listing = await findListingById(listingId);
  if (
    !listing ||
    listing.status === "Draft" ||
    listing.verificationStatus !== "Verified"
  ) {
    throw new HttpException(404, "Listing not found");
  }
  const sellerId = listing.seller.toString();
  if (sellerId === userId) {
    throw new HttpException(400, "You cannot message yourself about your listing");
  }
  const existing = await findConversationForListing(listingId, userId, sellerId);
  const conversation =
    existing ?? (await createConversationRecord(listingId, userId, sellerId));
  return conversationResponse(conversation, userId);
}

export async function getMessages(conversationId: string, userId: string) {
  await requireParticipant(conversationId, userId);
  const messages = await findMessagesForConversation(conversationId);
  return messages.map((message) => ({
    id: message._id.toString(),
    conversationId,
    senderId: message.sender.toString(),
    body: message.body,
    timestamp: message.createdAt,
    read: message.readBy.length > 1,
  }));
}

export async function sendMessage(
  conversationId: string,
  userId: string,
  rawBody: string
) {
  const conversation = await requireParticipant(conversationId, userId);
  const body = rawBody.trim();
  if (!body) throw new HttpException(400, "Message cannot be empty");
  if (body.length > 1000) {
    throw new HttpException(400, "Message cannot exceed 1000 characters");
  }
  const message = await createMessageRecord(conversationId, userId, body);
  await touchConversation(conversationId);
  const recipient = conversation.participants.find(
    (participant) => participant.toString() !== userId
  );
  if (recipient) {
    const sender = await findUserById(userId);
    await createNotification({
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

export async function readConversation(conversationId: string, userId: string) {
  await requireParticipant(conversationId, userId);
  await markMessagesRead(conversationId, userId);
}
