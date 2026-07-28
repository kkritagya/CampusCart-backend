import { model, Schema, Types } from "mongoose";

export interface IConversationDocument {
  _id: Types.ObjectId;
  listing: Types.ObjectId;
  participants: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversationDocument>(
  {
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
      validate: {
        validator: (participants: Types.ObjectId[]) => participants.length === 2,
        message: "A conversation requires exactly two participants",
      },
    },
  },
  { timestamps: true }
);

conversationSchema.index({ listing: 1, participants: 1 });
conversationSchema.index({ participants: 1, updatedAt: -1 });

export const ConversationModel = model<IConversationDocument>(
  "Conversation",
  conversationSchema
);
