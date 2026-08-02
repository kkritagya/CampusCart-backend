"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCart = listCart;
exports.listPurchases = listPurchases;
exports.sellerEarnings = sellerEarnings;
exports.addCartItem = addCartItem;
exports.removeCartItem = removeCartItem;
exports.checkout = checkout;
exports.verifyEsewa = verifyEsewa;
exports.esewaStatus = esewaStatus;
const http_exception_1 = require("../exceptions/http-exception");
const cart_service_1 = require("../services/cart.service");
const apihelper_util_1 = require("../utils/apihelper.util");
function failure(res, error) {
    return (0, apihelper_util_1.sendResponse)(res, error instanceof http_exception_1.HttpException ? error.statusCode : 500, false, error instanceof Error ? error.message : "Cart request failed");
}
async function listCart(req, res) {
    try {
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Cart fetched successfully", await (0, cart_service_1.getCart)(req.user.id));
    }
    catch (error) {
        return failure(res, error);
    }
}
async function listPurchases(req, res) {
    try {
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Purchases fetched successfully", await (0, cart_service_1.getPurchasedOrders)(req.user.id));
    }
    catch (error) {
        return failure(res, error);
    }
}
async function sellerEarnings(req, res) {
    try {
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Seller earnings fetched successfully", await (0, cart_service_1.getSellerEarnings)(req.user.id));
    }
    catch (error) {
        return failure(res, error);
    }
}
async function addCartItem(req, res) {
    try {
        return (0, apihelper_util_1.sendResponse)(res, 201, true, "Listing added to cart", await (0, cart_service_1.addToCart)(req.user.id, String(req.params.listingId)));
    }
    catch (error) {
        return failure(res, error);
    }
}
async function removeCartItem(req, res) {
    try {
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Listing removed from cart", await (0, cart_service_1.removeFromCart)(req.user.id, String(req.params.listingId)));
    }
    catch (error) {
        return failure(res, error);
    }
}
async function checkout(req, res) {
    try {
        return (0, apihelper_util_1.sendResponse)(res, 201, true, "eSewa payment initialized", await (0, cart_service_1.checkoutCart)(req.user.id, req.body?.billingAddress));
    }
    catch (error) {
        return failure(res, error);
    }
}
async function verifyEsewa(req, res) {
    try {
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "eSewa payment verified", await (0, cart_service_1.verifyEsewaPayment)(req.user.id, req.body?.data));
    }
    catch (error) {
        return failure(res, error);
    }
}
async function esewaStatus(req, res) {
    try {
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "eSewa payment status fetched", await (0, cart_service_1.getEsewaPaymentStatus)(req.user.id, req.query.transaction_uuid));
    }
    catch (error) {
        return failure(res, error);
    }
}
