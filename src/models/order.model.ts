import { model, Schema, Types } from "mongoose";

const billingSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    addressLine1: { type: String, required: true, trim: true, maxlength: 180 },
    addressLine2: { type: String, trim: true, maxlength: 180, default: "" },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    region: { type: String, required: true, trim: true, maxlength: 80 },
    postalCode: { type: String, required: true, trim: true, maxlength: 20 },
  },
  { _id: false }
);

const orderItemSchema = new Schema(
  {
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    billingAddress: { type: billingSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["esewa"], default: "esewa" },
    payment: {
      transactionUuid: { type: String, required: true, unique: true, index: true },
      transactionCode: { type: String, default: "" },
      status: { type: String, enum: ["Pending", "Complete", "Failed"], default: "Pending" },
      paidAt: { type: Date },
    },
    status: {
      type: String,
      enum: ["PaymentPending", "Placed", "Completed", "Cancelled"],
      default: "PaymentPending",
    },
  },
  { timestamps: true }
);

export const OrderModel = model("Order", orderSchema);
