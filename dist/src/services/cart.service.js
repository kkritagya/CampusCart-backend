"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCart = getCart;
exports.getPurchasedOrders = getPurchasedOrders;
exports.getSellerEarnings = getSellerEarnings;
exports.addToCart = addToCart;
exports.removeFromCart = removeFromCart;
exports.checkoutCart = checkoutCart;
exports.verifyEsewaPayment = verifyEsewaPayment;
const mongoose_1 = require("mongoose");
const crypto_1 = require("crypto");
const constant_1 = require("../configs/constant");
const http_exception_1 = require("../exceptions/http-exception");
const cart_model_1 = require("../models/cart.model");
const listing_model_1 = require("../models/listing.model");
const order_model_1 = require("../models/order.model");
const listing_service_1 = require("./listing.service");
const notification_service_1 = require("./notification.service");
function validateListingId(id) {
    if (!(0, mongoose_1.isValidObjectId)(id))
        throw new http_exception_1.HttpException(400, "Invalid listing ID");
}
function clean(value) {
    return typeof value === "string" ? value.trim() : "";
}
function validateBilling(input) {
    const body = (input ?? {});
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
    const required = ["fullName", "email", "phone", "addressLine1", "city", "region", "postalCode"];
    if (required.some((field) => !billing[field]))
        throw new http_exception_1.HttpException(400, "Complete all required billing fields");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billing.email))
        throw new http_exception_1.HttpException(400, "Enter a valid billing email");
    if (billing.phone.length < 7)
        throw new http_exception_1.HttpException(400, "Enter a valid phone number");
    return billing;
}
async function getCart(userId) {
    const cart = await cart_model_1.CartModel.findOne({ user: userId });
    if (!cart?.listings.length)
        return { items: [], subtotal: 0, total: 0 };
    const listings = await listing_model_1.ListingModel.find({
        _id: { $in: cart.listings },
        status: "Active",
        verificationStatus: "Verified",
    });
    const availableIds = new Set(listings.map((item) => item._id.toString()));
    if (availableIds.size !== cart.listings.length) {
        cart.listings = cart.listings.filter((id) => availableIds.has(id.toString()));
        await cart.save();
    }
    const items = await Promise.all(listings.map(listing_service_1.toListingResponse));
    const subtotal = listings.reduce((sum, listing) => sum + listing.price, 0);
    return { items, subtotal, total: subtotal };
}
async function getPurchasedOrders(userId) {
    const orders = await order_model_1.OrderModel.find({
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
async function getSellerEarnings(userId) {
    const sellerId = new mongoose_1.Types.ObjectId(userId);
    const orders = await order_model_1.OrderModel.find({
        "items.seller": sellerId,
        status: { $in: ["Placed", "Completed"] },
        "payment.status": "Complete",
    }).sort({ "payment.paidAt": -1 }).lean();
    const sales = orders.flatMap((order) => order.items
        .filter((item) => item.seller.equals(sellerId))
        .map((item) => ({
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        listingId: item.listing.toString(),
        title: item.title,
        amount: item.price,
        soldAt: order.payment?.paidAt ?? order.updatedAt,
    })));
    return {
        totalEarnings: sales.reduce((total, sale) => total + sale.amount, 0),
        soldItems: sales.length,
        paidOrders: new Set(sales.map((sale) => sale.orderId)).size,
        recentSales: sales.slice(0, 5),
    };
}
async function addToCart(userId, listingId) {
    validateListingId(listingId);
    const listing = await listing_model_1.ListingModel.findById(listingId);
    if (!listing ||
        listing.status !== "Active" ||
        listing.verificationStatus !== "Verified")
        throw new http_exception_1.HttpException(404, "Listing is no longer available");
    if (listing.seller.toString() === userId)
        throw new http_exception_1.HttpException(400, "You cannot buy your own listing");
    await cart_model_1.CartModel.findOneAndUpdate({ user: userId }, { $setOnInsert: { user: new mongoose_1.Types.ObjectId(userId) }, $addToSet: { listings: listing._id } }, { upsert: true, returnDocument: "after" });
    return getCart(userId);
}
async function removeFromCart(userId, listingId) {
    validateListingId(listingId);
    await cart_model_1.CartModel.updateOne({ user: userId }, { $pull: { listings: new mongoose_1.Types.ObjectId(listingId) } });
    return getCart(userId);
}
function amountForEsewa(amount) {
    return amount.toFixed(2);
}
function esewaSignature(message) {
    return (0, crypto_1.createHmac)("sha256", constant_1.ESEWA_SECRET_KEY).update(message).digest("base64");
}
async function checkoutCart(userId, billingInput) {
    if (!constant_1.ESEWA_PRODUCT_CODE || !constant_1.ESEWA_SECRET_KEY) {
        throw new http_exception_1.HttpException(503, "eSewa merchant credentials are not configured");
    }
    const billingAddress = validateBilling(billingInput);
    const cart = await cart_model_1.CartModel.findOne({ user: userId });
    if (!cart?.listings.length)
        throw new http_exception_1.HttpException(400, "Your cart is empty");
    const listings = await listing_model_1.ListingModel.find({ _id: { $in: cart.listings } });
    if (listings.length !== cart.listings.length ||
        listings.some((listing) => listing.status !== "Active" ||
            listing.verificationStatus !== "Verified")) {
        throw new http_exception_1.HttpException(409, "One or more cart items are no longer available");
    }
    if (listings.some((listing) => listing.seller.toString() === userId)) {
        throw new http_exception_1.HttpException(400, "Your cart contains one of your own listings");
    }
    const subtotal = listings.reduce((sum, listing) => sum + listing.price, 0);
    const orderNumber = `CC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const transactionUuid = `${orderNumber}-${Math.random().toString(36).slice(2, 8)}`.replace(/[^a-zA-Z0-9-]/g, "");
    const totalAmount = amountForEsewa(subtotal);
    const order = await order_model_1.OrderModel.create({
        orderNumber,
        buyer: new mongoose_1.Types.ObjectId(userId),
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
    const signature = esewaSignature(`total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${constant_1.ESEWA_PRODUCT_CODE}`);
    return {
        orderId: order._id.toString(),
        paymentUrl: constant_1.ESEWA_PAYMENT_URL,
        fields: {
            amount: totalAmount,
            tax_amount: "0",
            total_amount: totalAmount,
            transaction_uuid: transactionUuid,
            product_code: constant_1.ESEWA_PRODUCT_CODE,
            product_service_charge: "0",
            product_delivery_charge: "0",
            success_url: `${constant_1.CLIENT_ORIGIN}/payment/esewa/success`,
            failure_url: `${constant_1.CLIENT_ORIGIN}/payment/esewa/failure?transaction_uuid=${encodeURIComponent(transactionUuid)}`,
            signed_field_names: signedFieldNames,
            signature,
        },
    };
}
async function verifyEsewaPayment(userId, encodedData) {
    if (typeof encodedData !== "string" || !encodedData)
        throw new http_exception_1.HttpException(400, "Missing eSewa payment response");
    let response;
    try {
        response = JSON.parse(Buffer.from(encodedData, "base64").toString("utf8"));
    }
    catch {
        throw new http_exception_1.HttpException(400, "Invalid eSewa payment response");
    }
    const transactionUuid = clean(response.transaction_uuid);
    const order = await order_model_1.OrderModel.findOne({ buyer: userId, "payment.transactionUuid": transactionUuid });
    if (!order)
        throw new http_exception_1.HttpException(404, "Payment order not found");
    if (order.status === "Placed" && order.payment?.status === "Complete") {
        return { id: order._id.toString(), orderNumber: order.orderNumber, status: order.status, total: order.total, itemCount: order.items.length };
    }
    if (response.status !== "COMPLETE" || response.product_code !== constant_1.ESEWA_PRODUCT_CODE) {
        throw new http_exception_1.HttpException(400, "eSewa did not report a completed payment");
    }
    const signedFields = clean(response.signed_field_names).split(",").filter(Boolean);
    const allowedFields = new Set(["transaction_code", "status", "total_amount", "transaction_uuid", "product_code", "signed_field_names"]);
    if (!signedFields.length || signedFields.some((field) => !allowedFields.has(field))) {
        throw new http_exception_1.HttpException(400, "Invalid eSewa signature fields");
    }
    const values = response;
    const message = signedFields.map((field) => `${field}=${String(values[field] ?? "")}`).join(",");
    const expected = Buffer.from(esewaSignature(message));
    const received = Buffer.from(clean(response.signature));
    if (expected.length !== received.length || !(0, crypto_1.timingSafeEqual)(expected, received)) {
        throw new http_exception_1.HttpException(400, "eSewa response signature is invalid");
    }
    const expectedAmount = amountForEsewa(order.total);
    if (Number(response.total_amount) !== Number(expectedAmount))
        throw new http_exception_1.HttpException(400, "Payment amount does not match the order");
    const statusUrl = new URL(constant_1.ESEWA_STATUS_URL);
    statusUrl.searchParams.set("product_code", constant_1.ESEWA_PRODUCT_CODE);
    statusUrl.searchParams.set("total_amount", expectedAmount);
    statusUrl.searchParams.set("transaction_uuid", transactionUuid);
    const statusResponse = await fetch(statusUrl);
    if (!statusResponse.ok)
        throw new http_exception_1.HttpException(502, "Unable to verify payment with eSewa");
    const status = (await statusResponse.json());
    if (status.status !== "COMPLETE")
        throw new http_exception_1.HttpException(400, "eSewa payment verification was not complete");
    const listingIds = order.items.map((item) => item.listing);
    const sold = await listing_model_1.ListingModel.updateMany({ _id: { $in: listingIds }, status: "Active" }, { $set: { status: "Sold" } });
    if (sold.modifiedCount !== listingIds.length)
        throw new http_exception_1.HttpException(409, "One or more paid listings are no longer available; contact support");
    order.set({
        status: "Placed",
        "payment.status": "Complete",
        "payment.transactionCode": clean(response.transaction_code) || clean(status.ref_id),
        "payment.paidAt": new Date(),
    });
    await order.save();
    await (0, notification_service_1.createNotifications)(order.items.map((item) => ({
        recipient: item.seller,
        type: "sale",
        title: `${item.title} has sold`,
        body: `${order.billingAddress.fullName} bought your item for Rs. ${item.price.toLocaleString()}.`,
        href: "/dashboard/listings",
    })));
    await cart_model_1.CartModel.updateOne({ user: userId }, { $pull: { listings: { $in: listingIds } } });
    return { id: order._id.toString(), orderNumber: order.orderNumber, status: order.status, total: order.total, itemCount: order.items.length };
}
