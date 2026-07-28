import { model, Schema, Types } from "mongoose";

export interface IPasswordResetTokenDocument {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const passwordResetTokenSchema = new Schema<IPasswordResetTokenDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

export const PasswordResetTokenModel =
  model<IPasswordResetTokenDocument>(
    "PasswordResetToken",
    passwordResetTokenSchema
  );
