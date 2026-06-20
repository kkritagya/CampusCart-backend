"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const http_exception_1 = require("../exceptions/http-exception");
// Ensure upload directory exists
const uploadDir = path_1.default.join(__dirname, "../../uploads/profile_pics");
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Use user ID to make file names clean and unique
        const userId = req.user?.id || "anonymous";
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${userId}-${Date.now()}${ext}`);
    },
});
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
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});
