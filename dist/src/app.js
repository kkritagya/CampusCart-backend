"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const constant_1 = require("./configs/constant");
const user_route_1 = __importDefault(require("./routes/user.route"));
const apihelper_util_1 = require("./utils/apihelper.util");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: constant_1.CLIENT_ORIGIN,
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get("/", (_req, res) => {
    return (0, apihelper_util_1.sendResponse)(res, 200, true, "Campus backend API is running");
});
app.use("/api/auth", user_route_1.default);
app.use((_req, res) => {
    return (0, apihelper_util_1.sendResponse)(res, 404, false, "Route not found");
});
app.use((error, _req, res, _next) => {
    return (0, apihelper_util_1.sendResponse)(res, 500, false, error.message || "Internal server error");
});
exports.default = app;
