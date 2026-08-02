"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiImageUpload = exports.listingUpload = exports.upload = void 0;
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const http_exception_1 = require("../exceptions/http-exception");
// Ensure upload directory exists
const profileUploadDir = path_1.default.resolve(process.cwd(), "uploads/profile_pics");
const listingUploadDir = path_1.default.resolve(process.cwd(), "uploads/listings");
[profileUploadDir, listingUploadDir].forEach((directory) => {
    if (!fs_1.default.existsSync(directory))
        fs_1.default.mkdirSync(directory, { recursive: true });
});
function storageFor(directory) {
    return multer_1.default.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, directory);
        },
        filename: (req, file, cb) => {
            const request = req;
            const userId = request.user?.id || "anonymous";
            const ext = path_1.default.extname(file.originalname).toLowerCase();
            cb(null, `${userId}-${(0, crypto_1.randomUUID)()}${ext}`);
        },
    });
}
const fileFilter = (_req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new http_exception_1.HttpException(400, "Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed."));
    }
};
exports.upload = (0, multer_1.default)({
    storage: storageFor(profileUploadDir),
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});
exports.listingUpload = (0, multer_1.default)({
    storage: storageFor(listingUploadDir),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 6 },
});
exports.aiImageUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});
