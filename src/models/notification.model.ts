import { model, Schema, Types } from "mongoose";

export interface INotificationDocument {
  _id: Types.ObjectId;
  recipient: Types.ObjectId;
  type: "message" | "sale" | "moderation" | "saved" | "cart" | "purchase";
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["message", "sale", "moderation", "saved", "cart", "purchase"],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, trim: true, maxlength: 500 },
    href: { type: String, required: true, maxlength: 300 },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export const NotificationModel = model<INotificationDocument>(
  "Notification",
  notificationSchema
);
