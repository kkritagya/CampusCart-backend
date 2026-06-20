"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProfilePictureService = exports.getUserById = exports.loginUser = exports.registerUser = exports.toUserResponse = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const constant_1 = require("../configs/constant");
const http_exception_1 = require("../exceptions/http-exception");
const user_repository_1 = require("../repositories/user.repository");
const toUserResponse = (user) => ({
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    profilePicture: user.profilePicture,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});
exports.toUserResponse = toUserResponse;
const registerUser = async (dto) => {
    const existingUser = await (0, user_repository_1.findUserByEmail)(dto.email);
    if (existingUser) {
        throw new http_exception_1.HttpException(409, "Email already exists");
    }
    const hashedPassword = await bcryptjs_1.default.hash(dto.password, constant_1.BCRYPT_SALT_ROUNDS);
    const user = await (0, user_repository_1.createUser)({
        fullName: dto.fullName,
        email: dto.email,
        password: hashedPassword,
    });
    return (0, exports.toUserResponse)(user);
};
exports.registerUser = registerUser;
const loginUser = async (dto) => {
    const user = await (0, user_repository_1.findUserByEmail)(dto.email);
    if (!user) {
        throw new http_exception_1.HttpException(401, "Invalid email or password");
    }
    const isPasswordValid = await bcryptjs_1.default.compare(dto.password, user.password);
    if (!isPasswordValid) {
        throw new http_exception_1.HttpException(401, "Invalid email or password");
    }
    if (!constant_1.JWT_SECRET) {
        throw new http_exception_1.HttpException(500, "JWT_SECRET is missing in environment variables");
    }
    const payload = { userId: user._id.toString() };
    const token = jsonwebtoken_1.default.sign(payload, constant_1.JWT_SECRET, { expiresIn: constant_1.JWT_EXPIRES_IN });
    return {
        user: (0, exports.toUserResponse)(user),
        token,
    };
};
exports.loginUser = loginUser;
const getUserById = async (userId) => {
    const user = await (0, user_repository_1.findUserById)(userId);
    if (!user) {
        throw new http_exception_1.HttpException(404, "User not found");
    }
    return (0, exports.toUserResponse)(user);
};
exports.getUserById = getUserById;
const updateUserProfilePictureService = async (userId, profilePicturePath) => {
    const user = await (0, user_repository_1.updateUserProfilePicture)(userId, profilePicturePath);
    if (!user) {
        throw new http_exception_1.HttpException(404, "User not found");
    }
    return (0, exports.toUserResponse)(user);
};
exports.updateUserProfilePictureService = updateUserProfilePictureService;
