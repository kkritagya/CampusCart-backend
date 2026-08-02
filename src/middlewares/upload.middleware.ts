import fs from "fs";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { HttpException } from "../exceptions/http-exception";

// Ensure upload directory exists
const profileUploadDir = path.resolve(process.cwd(), "uploads/profile_pics");
const listingUploadDir = path.resolve(process.cwd(), "uploads/listings");
[profileUploadDir, listingUploadDir].forEach((directory) => {
  if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
});

function storageFor(directory: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, directory);
    },
    filename: (req, file, cb) => {
      const request = req as typeof req & { user?: { id: string } };
      const userId = request.user?.id || "anonymous";
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${userId}-${randomUUID()}${ext}`);
    },
  });
}

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new HttpException(
        400,
        "Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed."
      )
    );
  }
};

export const upload = multer({
  storage: storageFor(profileUploadDir),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export const listingUpload = multer({
  storage: storageFor(listingUploadDir),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
});

export const aiImageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});
