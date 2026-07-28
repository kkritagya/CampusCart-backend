import { model, Schema, Types } from "mongoose";

export interface ICartDocument {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  listings: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const cartSchema = new Schema<ICartDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    listings: [{ type: Schema.Types.ObjectId, ref: "Listing", required: true }],
  },
  { timestamps: true }
);

export const CartModel = model<ICartDocument>("Cart", cartSchema);
