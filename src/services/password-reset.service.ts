import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { PASSWORD_RESET_URL } from "../configs/constant";
import { HttpException } from "../exceptions/http-exception";
import { PasswordResetTokenModel } from "../models/password-reset-token.model";
import { findUserByEmail, updateUser } from "../repositories/user.repository";
import { sendPasswordResetEmail } from "./email.service";
import { BCRYPT_SALT_ROUNDS } from "../configs/constant";

const RESET_EXPIRY_MS = 60 * 60 * 1000;
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function requestPasswordReset(email: string) {
  const user = await findUserByEmail(email);
  if (!user) return;

  const token = randomBytes(32).toString("hex");
  await PasswordResetTokenModel.deleteMany({ user: user._id });
  await PasswordResetTokenModel.create({
    user: user._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + RESET_EXPIRY_MS),
  });

  const resetLink = `${PASSWORD_RESET_URL}?token=${encodeURIComponent(token)}`;
  try {
    await sendPasswordResetEmail(user.email, resetLink);
  } catch (error) {
    await PasswordResetTokenModel.deleteMany({ user: user._id });
    throw error;
  }
}

export async function resetPassword(token: string, newPassword: string) {
  const record = await PasswordResetTokenModel.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!record) {
    throw new HttpException(400, "Reset link is invalid or has expired");
  }

  const password = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  const user = await updateUser(record.user.toString(), { password });
  if (!user) throw new HttpException(404, "User not found");
  await PasswordResetTokenModel.deleteMany({ user: record.user });
}
