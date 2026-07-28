"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeAdminUser = exports.updateAdminUser = exports.createAdminUser = exports.getAdminUser = exports.listAdminUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = require("mongoose");
const constant_1 = require("../configs/constant");
const http_exception_1 = require("../exceptions/http-exception");
const user_repository_1 = require("../repositories/user.repository");
const user_service_1 = require("./user.service");
const validate = (input, creating) => {
    if (creating || input.fullName !== undefined) {
        if (!input.fullName || input.fullName.trim().length < 2) {
            throw new http_exception_1.HttpException(400, "Full name must be at least 2 characters");
        }
    }
    if (creating || input.email !== undefined) {
        if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
            throw new http_exception_1.HttpException(400, "A valid email is required");
        }
    }
    if ((creating || input.password !== undefined) && (!input.password || input.password.length < 6)) {
        throw new http_exception_1.HttpException(400, "Password must be at least 6 characters");
    }
    if (input.role && !["user", "admin"].includes(input.role)) {
        throw new http_exception_1.HttpException(400, "Role must be user or admin");
    }
    if (input.status && !["active", "inactive"].includes(input.status)) {
        throw new http_exception_1.HttpException(400, "Status must be active or inactive");
    }
};
const listAdminUsers = async (page, limit, search) => {
    const result = await (0, user_repository_1.findUsers)({ page, limit, search });
    return {
        data: result.users.map(user_service_1.toUserResponse),
        meta: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
        },
    };
};
exports.listAdminUsers = listAdminUsers;
const getAdminUser = async (id) => {
    if (!(0, mongoose_1.isValidObjectId)(id))
        throw new http_exception_1.HttpException(400, "Invalid user id");
    const user = await (0, user_repository_1.findUserById)(id);
    if (!user)
        throw new http_exception_1.HttpException(404, "User not found");
    return (0, user_service_1.toUserResponse)(user);
};
exports.getAdminUser = getAdminUser;
const createAdminUser = async (input) => {
    validate(input, true);
    if (await (0, user_repository_1.findUserByEmail)(input.email))
        throw new http_exception_1.HttpException(409, "Email already exists");
    const user = await (0, user_repository_1.createUser)({
        fullName: input.fullName,
        email: input.email,
        password: await bcryptjs_1.default.hash(input.password, constant_1.BCRYPT_SALT_ROUNDS),
    });
    if (input.role || input.status) {
        const updated = await (0, user_repository_1.updateUser)(user._id.toString(), {
            role: input.role ?? "user",
            status: input.status ?? "active",
        });
        return (0, user_service_1.toUserResponse)(updated);
    }
    return (0, user_service_1.toUserResponse)(user);
};
exports.createAdminUser = createAdminUser;
const updateAdminUser = async (id, input) => {
    if (!(0, mongoose_1.isValidObjectId)(id))
        throw new http_exception_1.HttpException(400, "Invalid user id");
    validate(input, false);
    const current = await (0, user_repository_1.findUserById)(id);
    if (!current)
        throw new http_exception_1.HttpException(404, "User not found");
    if (input.email && input.email.toLowerCase().trim() !== current.email) {
        if (await (0, user_repository_1.findUserByEmail)(input.email))
            throw new http_exception_1.HttpException(409, "Email already exists");
    }
    const update = { ...input };
    if (update.fullName)
        update.fullName = update.fullName.trim();
    if (update.email)
        update.email = update.email.toLowerCase().trim();
    if (update.password)
        update.password = await bcryptjs_1.default.hash(update.password, constant_1.BCRYPT_SALT_ROUNDS);
    else
        delete update.password;
    const user = await (0, user_repository_1.updateUser)(id, update);
    return (0, user_service_1.toUserResponse)(user);
};
exports.updateAdminUser = updateAdminUser;
const removeAdminUser = async (id, requestingUserId) => {
    if (!(0, mongoose_1.isValidObjectId)(id))
        throw new http_exception_1.HttpException(400, "Invalid user id");
    if (id === requestingUserId)
        throw new http_exception_1.HttpException(400, "You cannot delete your own account");
    const deleted = await (0, user_repository_1.deleteUserById)(id);
    if (!deleted)
        throw new http_exception_1.HttpException(404, "User not found");
};
exports.removeAdminUser = removeAdminUser;
