import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { BCRYPT_SALT_ROUNDS } from "../configs/constant";
import { HttpException } from "../exceptions/http-exception";
import { MobilePasswordResetModel } from "../models/mobile-password-reset.model";
import { findUserByEmail, updateUser } from "../repositories/user.repository";
import { sendPasswordResetOtpEmail } from "./email.service";

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const VERIFIED_EXPIRY_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");

const otpHash = (salt: string, otp: string) => hash(`${salt}:${otp}`);

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export async function requestMobilePasswordReset(emailInput: string) {
  const email = emailInput.trim().toLowerCase();
  const user = await findUserByEmail(email);
  if (!user) return;

  const otp = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const salt = randomBytes(16).toString("hex");
  await MobilePasswordResetModel.findOneAndUpdate(
    { user: user._id },
    {
      $set: {
        user: user._id,
        email: user.email,
        otpHash: otpHash(salt, otp),
        otpSalt: salt,
        attempts: 0,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      },
      $unset: { resetTokenHash: 1, verifiedAt: 1 },
    },
    { upsert: true, returnDocument: "after" }
  );

  try {
    await sendPasswordResetOtpEmail(user.email, otp);
  } catch (error) {
    await MobilePasswordResetModel.deleteOne({ user: user._id });
    throw error;
  }
}

export async function verifyMobilePasswordResetOtp(
  emailInput: string,
  otp: string
) {
  const email = emailInput.trim().toLowerCase();
  const record = await MobilePasswordResetModel.findOne({
    email,
    expiresAt: { $gt: new Date() },
  });
  if (!record || record.attempts >= MAX_ATTEMPTS) {
    throw new HttpException(400, "OTP is invalid or has expired");
  }

  const matches = safeEqual(
    record.otpHash,
    otpHash(record.otpSalt, otp)
  );
  if (!matches) {
    record.attempts += 1;
    await record.save();
    throw new HttpException(400, "OTP is invalid or has expired");
  }

  const resetToken = randomBytes(32).toString("hex");
  record.resetTokenHash = hash(resetToken);
  record.verifiedAt = new Date();
  record.expiresAt = new Date(Date.now() + VERIFIED_EXPIRY_MS);
  await record.save();
  return resetToken;
}

export async function resetMobilePassword(
  emailInput: string,
  resetToken: string,
  newPassword: string
) {
  const email = emailInput.trim().toLowerCase();
  const record = await MobilePasswordResetModel.findOne({
    email,
    resetTokenHash: hash(resetToken),
    verifiedAt: { $exists: true },
    expiresAt: { $gt: new Date() },
  });
  if (!record) {
    throw new HttpException(400, "Reset session is invalid or has expired");
  }

  const password = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  const user = await updateUser(record.user.toString(), { password });
  if (!user) throw new HttpException(404, "User not found");
  await MobilePasswordResetModel.deleteOne({ _id: record._id });
}
