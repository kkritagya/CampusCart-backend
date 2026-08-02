import { isValidObjectId, Types } from "mongoose";
import { createHmac, timingSafeEqual } from "crypto";
import {
  CLIENT_ORIGIN,
  ESEWA_PAYMENT_URL,
  ESEWA_PRODUCT_CODE,
  ESEWA_SECRET_KEY,
  ESEWA_STATUS_URL,
} from "../configs/constant";
import { HttpException } from "../exceptions/http-exception";
import { CartModel } from "../models/cart.model";
import { ListingModel } from "../models/listing.model";
import { OrderModel } from "../models/order.model";
import { toListingResponse } from "./listing.service";
import { createNotification, createNotifications } from "./notification.service";

export type BillingAddress = {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  postalCode: string;
};

function validateListingId(id: string) {
  if (!isValidObjectId(id)) throw new HttpException(400, "Invalid listing ID");
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validateBilling(input: unknown): BillingAddress {
  const body = (input ?? {}) as Record<string, unknown>;
  const billing = {
    fullName: clean(body.fullName),
    email: clean(body.email).toLowerCase(),
    phone: clean(body.phone),
    addressLine1: clean(body.addressLine1),
    addressLine2: clean(body.addressLine2),
    city: clean(body.city),
    region: clean(body.region),
    postalCode: clean(body.postalCode),
  };
  const required = ["fullName", "email", "phone", "addressLine1", "city", "region", "postalCode"] as const;
  if (required.some((field) => !billing[field])) throw new HttpException(400, "Complete all required billing fields");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billing.email)) throw new HttpException(400, "Enter a valid billing email");
  if (billing.phone.length < 7) throw new HttpException(400, "Enter a valid phone number");
  return billing;
}

export async function getCart(userId: string) {
  const cart = await CartModel.findOne({ user: userId });
  if (!cart?.listings.length) return { items: [], subtotal: 0, total: 0 };
  const listings = await ListingModel.find({
    _id: { $in: cart.listings },
    status: "Active",
    verificationStatus: "Verified",
  });
  const availableIds = new Set(listings.map((item) => item._id.toString()));
  if (availableIds.size !== cart.listings.length) {
    cart.listings = cart.listings.filter((id) => availableIds.has(id.toString()));
    await cart.save();
  }
  const items = await Promise.all(listings.map(toListingResponse));
  const subtotal = listings.reduce((sum, listing) => sum + listing.price, 0);
  return { items, subtotal, total: subtotal };
}

export async function getPurchasedOrders(userId: string) {
  const orders = await OrderModel.find({
    buyer: userId,
    status: { $in: ["Placed", "Completed"] },
    "payment.status": "Complete",
  }).sort({ createdAt: -1 }).lean();

  return orders.map((order) => ({
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    status: order.status,
    total: order.total,
    purchasedAt: order.payment?.paidAt ?? order.updatedAt,
    items: order.items.map((item) => ({
      listingId: item.listing.toString(),
      title: item.title,
      price: item.price,
      image: item.image,
    })),
  }));
}

export async function getSellerEarnings(userId: string) {
  const sellerId = new Types.ObjectId(userId);
  const orders = await OrderModel.find({
    "items.seller": sellerId,
    status: { $in: ["Placed", "Completed"] },
    "payment.status": "Complete",
  }).sort({ "payment.paidAt": -1 }).lean();

  const sales = orders.flatMap((order) =>
    order.items
      .filter((item) => item.seller.equals(sellerId))
      .map((item) => ({
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        listingId: item.listing.toString(),
        title: item.title,
        amount: item.price,
        soldAt: order.payment?.paidAt ?? order.updatedAt,
      }))
  );

  return {
    totalEarnings: sales.reduce((total, sale) => total + sale.amount, 0),
    soldItems: sales.length,
    paidOrders: new Set(sales.map((sale) => sale.orderId)).size,
    recentSales: sales.slice(0, 5),
  };
}

export async function addToCart(userId: string, listingId: string) {
  validateListingId(listingId);
  const listing = await ListingModel.findById(listingId);
  if (
    !listing ||
    listing.status !== "Active" ||
    listing.verificationStatus !== "Verified"
  ) throw new HttpException(404, "Listing is no longer available");
  if (listing.seller.toString() === userId) throw new HttpException(400, "You cannot buy your own listing");
  const currentCart = await CartModel.findOne({ user: userId });
  const alreadyInCart =
    currentCart?.listings.some((id) => id.toString() === listingId) ?? false;
  await CartModel.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: new Types.ObjectId(userId) }, $addToSet: { listings: listing._id } },
    { upsert: true, returnDocument: "after" }
  );
  if (!alreadyInCart) {
    await createNotification({
      recipient: userId,
      type: "cart",
      title: "Added to cart",
      body: `${listing.title} is ready in your cart.`,
      href: "/cart",
    });
  }
  return getCart(userId);
}

export async function removeFromCart(userId: string, listingId: string) {
  validateListingId(listingId);
  await CartModel.updateOne({ user: userId }, { $pull: { listings: new Types.ObjectId(listingId) } });
  return getCart(userId);
}

function amountForEsewa(amount: number) {
  return amount.toFixed(2);
}

function esewaSignature(message: string) {
  return createHmac("sha256", ESEWA_SECRET_KEY).update(message).digest("base64");
}

type EsewaStatusResponse = {
  status?: string;
  ref_id?: string | null;
};

async function fetchEsewaStatus(transactionUuid: string, total: number) {
  const statusUrl = new URL(ESEWA_STATUS_URL);
  statusUrl.searchParams.set("product_code", ESEWA_PRODUCT_CODE);
  statusUrl.searchParams.set("total_amount", amountForEsewa(total));
  statusUrl.searchParams.set("transaction_uuid", transactionUuid);
  const response = await fetch(statusUrl);
  if (!response.ok) throw new HttpException(502, "Unable to check payment status with eSewa");
  return (await response.json()) as EsewaStatusResponse;
}

export async function getEsewaPaymentStatus(userId: string, transactionUuidInput: unknown) {
  const transactionUuid = clean(transactionUuidInput);
  if (!transactionUuid || !/^[a-zA-Z0-9-]+$/.test(transactionUuid)) {
    throw new HttpException(400, "Invalid eSewa transaction ID");
  }
  const order = await OrderModel.findOne({ buyer: userId, "payment.transactionUuid": transactionUuid });
  if (!order) throw new HttpException(404, "Payment order not found");
  if (order.payment?.status === "Complete") {
    return { status: "COMPLETE", orderNumber: order.orderNumber, transactionUuid };
  }

  const payment = await fetchEsewaStatus(transactionUuid, order.total);
  const status = clean(payment.status).toUpperCase() || "UNKNOWN";
  if (["CANCELED", "NOT_FOUND", "FULL_REFUND", "PARTIAL_REFUND"].includes(status)) {
    order.set({ status: "Cancelled", "payment.status": "Failed" });
    await order.save();
  }
  return { status, orderNumber: order.orderNumber, transactionUuid };
}

export async function checkoutCart(userId: string, billingInput: unknown) {
  if (!ESEWA_PRODUCT_CODE || !ESEWA_SECRET_KEY) {
    throw new HttpException(503, "eSewa merchant credentials are not configured");
  }
  const billingAddress = validateBilling(billingInput);
  const cart = await CartModel.findOne({ user: userId });
  if (!cart?.listings.length) throw new HttpException(400, "Your cart is empty");
  const listings = await ListingModel.find({ _id: { $in: cart.listings } });
  if (
    listings.length !== cart.listings.length ||
    listings.some(
      (listing) =>
        listing.status !== "Active" ||
        listing.verificationStatus !== "Verified"
    )
  ) {
    throw new HttpException(409, "One or more cart items are no longer available");
  }
  if (listings.some((listing) => listing.seller.toString() === userId)) {
    throw new HttpException(400, "Your cart contains one of your own listings");
  }
  const subtotal = listings.reduce((sum, listing) => sum + listing.price, 0);
  const orderNumber = `CC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const transactionUuid = `${orderNumber}-${Math.random().toString(36).slice(2, 8)}`.replace(/[^a-zA-Z0-9-]/g, "");
  const totalAmount = amountForEsewa(subtotal);
  const order = await OrderModel.create({
    orderNumber,
    buyer: new Types.ObjectId(userId),
    items: listings.map((listing) => ({
      listing: listing._id,
      seller: listing.seller,
      title: listing.title,
      price: listing.price,
      image: listing.images[0] ?? "",
    })),
    billingAddress,
    subtotal,
    total: subtotal,
    paymentMethod: "esewa",
    payment: { transactionUuid, status: "Pending" },
    status: "PaymentPending",
  });
  const signedFieldNames = "total_amount,transaction_uuid,product_code";
  const signature = esewaSignature(
    `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${ESEWA_PRODUCT_CODE}`
  );
  return {
    orderId: order._id.toString(),
    paymentUrl: ESEWA_PAYMENT_URL,
    fields: {
      amount: totalAmount,
      tax_amount: "0",
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: ESEWA_PRODUCT_CODE,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${CLIENT_ORIGIN}/payment/esewa/success`,
      failure_url: `${CLIENT_ORIGIN}/payment/esewa/failure?transaction_uuid=${encodeURIComponent(transactionUuid)}`,
      signed_field_names: signedFieldNames,
      signature,
    },
  };
}

type EsewaCallback = {
  status?: string;
  signature?: string;
  transaction_code?: string;
  total_amount?: string | number;
  transaction_uuid?: string;
  product_code?: string;
  signed_field_names?: string;
};

export async function verifyEsewaPayment(userId: string, encodedData: unknown) {
  if (typeof encodedData !== "string" || !encodedData) throw new HttpException(400, "Missing eSewa payment response");
  let response: EsewaCallback;
  try {
    response = JSON.parse(Buffer.from(encodedData, "base64").toString("utf8")) as EsewaCallback;
  } catch {
    throw new HttpException(400, "Invalid eSewa payment response");
  }
  const transactionUuid = clean(response.transaction_uuid);
  const order = await OrderModel.findOne({ buyer: userId, "payment.transactionUuid": transactionUuid });
  if (!order) throw new HttpException(404, "Payment order not found");
  if (order.status === "Placed" && order.payment?.status === "Complete") {
    return { id: order._id.toString(), orderNumber: order.orderNumber, status: order.status, total: order.total, itemCount: order.items.length };
  }
  if (response.status !== "COMPLETE" || response.product_code !== ESEWA_PRODUCT_CODE) {
    throw new HttpException(400, "eSewa did not report a completed payment");
  }
  const signedFields = clean(response.signed_field_names).split(",").filter(Boolean);
  const allowedFields = new Set(["transaction_code", "status", "total_amount", "transaction_uuid", "product_code", "signed_field_names"]);
  if (!signedFields.length || signedFields.some((field) => !allowedFields.has(field))) {
    throw new HttpException(400, "Invalid eSewa signature fields");
  }
  const values = response as Record<string, unknown>;
  const message = signedFields.map((field) => `${field}=${String(values[field] ?? "")}`).join(",");
  const expected = Buffer.from(esewaSignature(message));
  const received = Buffer.from(clean(response.signature));
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    throw new HttpException(400, "eSewa response signature is invalid");
  }
  const expectedAmount = amountForEsewa(order.total);
  if (Number(response.total_amount) !== Number(expectedAmount)) throw new HttpException(400, "Payment amount does not match the order");

  const status = await fetchEsewaStatus(transactionUuid, order.total);
  if (status.status !== "COMPLETE") throw new HttpException(400, "eSewa payment verification was not complete");

  const listingIds = order.items.map((item) => item.listing);
  const sold = await ListingModel.updateMany({ _id: { $in: listingIds }, status: "Active" }, { $set: { status: "Sold" } });
  if (sold.modifiedCount !== listingIds.length) throw new HttpException(409, "One or more paid listings are no longer available; contact support");
  order.set({
    status: "Placed",
    "payment.status": "Complete",
    "payment.transactionCode": clean(response.transaction_code) || clean(status.ref_id),
    "payment.paidAt": new Date(),
  });
  await order.save();
  await createNotifications(
    order.items.map((item) => ({
      recipient: item.seller,
      type: "sale" as const,
      title: `${item.title} has sold`,
      body: `${order.billingAddress.fullName} bought your item for Rs. ${item.price.toLocaleString()}.`,
      href: "/dashboard/listings",
    }))
  );
  await createNotification({
    recipient: userId,
    type: "purchase",
    title: "Purchase completed",
    body: `Order ${order.orderNumber} was paid successfully with eSewa.`,
    href: "/purchases",
  });
  await CartModel.updateOne({ user: userId }, { $pull: { listings: { $in: listingIds } } });
  return { id: order._id.toString(), orderNumber: order.orderNumber, status: order.status, total: order.total, itemCount: order.items.length };
}
