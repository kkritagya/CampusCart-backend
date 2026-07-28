"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.editUser = exports.addUser = exports.viewUser = exports.listUsers = exports.verifyAdmin = void 0;
const http_exception_1 = require("../exceptions/http-exception");
const admin_user_service_1 = require("../services/admin-user.service");
const apihelper_util_1 = require("../utils/apihelper.util");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const constant_1 = require("../configs/constant");
const user_repository_1 = require("../repositories/user.repository");
const fail = (res, error) => (0, apihelper_util_1.sendResponse)(res, error instanceof http_exception_1.HttpException ? error.statusCode : 500, false, error instanceof Error ? error.message : "Admin user operation failed");
const verifyAdmin = async (req, res) => {
    try {
        const password = typeof req.body?.password === "string" ? req.body.password : "";
        const user = req.user ? await (0, user_repository_1.findUserById)(req.user.id) : null;
        if (!user || !password || !(await bcryptjs_1.default.compare(password, user.password))) {
            return (0, apihelper_util_1.sendResponse)(res, 401, false, "Incorrect password");
        }
        if (!constant_1.JWT_SECRET)
            throw new http_exception_1.HttpException(500, "JWT_SECRET is missing");
        const token = jsonwebtoken_1.default.sign({ userId: user._id.toString(), purpose: "admin" }, constant_1.JWT_SECRET, { expiresIn: "15m" });
        res.cookie("admin_session", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 15 * 60 * 1000,
        });
        return (0, apihelper_util_1.sendResponse)(res, 200, true, "Admin access verified");
    }
    catch (error) {
        return fail(res, error);
    }
};
exports.verifyAdmin = verifyAdmin;
const listUsers = async (req, res) => {
    try {
        const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
        const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? "10"), 10) || 10));
        const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
        return res.json(await (0, admin_user_service_1.listAdminUsers)(page, limit, search));
    }
    catch (error) {
        return fail(res, error);
    }
};
exports.listUsers = listUsers;
const viewUser = async (req, res) => {
    try {
        return res.json(await (0, admin_user_service_1.getAdminUser)(String(req.params.id)));
    }
    catch (error) {
        return fail(res, error);
    }
};
exports.viewUser = viewUser;
const addUser = async (req, res) => {
    try {
        return res.status(201).json(await (0, admin_user_service_1.createAdminUser)(req.body));
    }
    catch (error) {
        return fail(res, error);
    }
};
exports.addUser = addUser;
const editUser = async (req, res) => {
    try {
        return res.json(await (0, admin_user_service_1.updateAdminUser)(String(req.params.id), req.body));
    }
    catch (error) {
        return fail(res, error);
    }
};
exports.editUser = editUser;
const deleteUser = async (req, res) => {
    try {
        await (0, admin_user_service_1.removeAdminUser)(String(req.params.id), req.user.id);
        return res.status(204).send();
    }
    catch (error) {
        return fail(res, error);
    }
};
exports.deleteUser = deleteUser;
