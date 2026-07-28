"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const constant_1 = require("./configs/constant");
const user_route_1 = __importDefault(require("./routes/user.route"));
const listing_route_1 = __importDefault(require("./routes/listing.route"));
const saved_listing_route_1 = __importDefault(require("./routes/saved-listing.route"));
const conversation_route_1 = __importDefault(require("./routes/conversation.route"));
const apihelper_util_1 = require("./utils/apihelper.util");
const http_exception_1 = require("./exceptions/http-exception");
const admin_user_route_1 = __importDefault(require("./routes/admin-user.route"));
const cart_route_1 = __importDefault(require("./routes/cart.route"));
const admin_listing_route_1 = __importDefault(require("./routes/admin-listing.route"));
const notification_route_1 = __importDefault(require("./routes/notification.route"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: constant_1.CLIENT_ORIGIN,
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/uploads", express_1.default.static(path_1.default.resolve(process.cwd(), "uploads")));
app.get("/", (_req, res) => {
    return (0, apihelper_util_1.sendResponse)(res, 200, true, "Campus backend API is running");
});
// Keep the original mobile routes and the versioned web routes compatible.
app.use("/api/auth", user_route_1.default);
app.use("/api/listings", listing_route_1.default);
app.use("/api/saved", saved_listing_route_1.default);
app.use("/api/conversations", conversation_route_1.default);
app.use("/api/cart", cart_route_1.default);
app.use("/api/notifications", notification_route_1.default);
app.use("/api/v1/auth", user_route_1.default);
app.use("/api/v1/listings", listing_route_1.default);
app.use("/api/v1/saved", saved_listing_route_1.default);
app.use("/api/v1/conversations", conversation_route_1.default);
app.use("/api/v1/cart", cart_route_1.default);
app.use("/api/v1/notifications", notification_route_1.default);
app.use("/api/v1/admin/users", admin_user_route_1.default);
app.use("/api/v1/admin/listings", admin_listing_route_1.default);
app.use((_req, res) => {
    return (0, apihelper_util_1.sendResponse)(res, 404, false, "Route not found");
});
app.use((error, _req, res, _next) => {
    const statusCode = error instanceof http_exception_1.HttpException ? error.statusCode : 500;
    return (0, apihelper_util_1.sendResponse)(res, statusCode, false, error.message || "Internal server error");
});
exports.default = app;
