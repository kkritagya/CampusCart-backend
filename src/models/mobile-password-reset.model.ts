import { model, Schema, Types } from "mongoose";

export interface IMobilePasswordResetDocument {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  email: string;
  otpHash: string;
  otpSalt: string;
  attempts: number;
  resetTokenHash?: string;
  verifiedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const mobilePasswordResetSchema =
  new Schema<IMobilePasswordResetDocument>(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
      },
      email: { type: String, required: true, lowercase: true, trim: true },
      otpHash: { type: String, required: true },
      otpSalt: { type: String, required: true },
      attempts: { type: Number, default: 0, min: 0 },
      resetTokenHash: { type: String, index: true, sparse: true },
      verifiedAt: { type: Date },
      expiresAt: { type: Date, required: true, index: { expires: 0 } },
    },
    { timestamps: true }
  );

export const MobilePasswordResetModel =
  model<IMobilePasswordResetDocument>(
    "MobilePasswordReset",
    mobilePasswordResetSchema
  );
