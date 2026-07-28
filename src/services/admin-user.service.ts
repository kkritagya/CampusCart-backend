import bcrypt from "bcryptjs";
import { isValidObjectId } from "mongoose";
import { BCRYPT_SALT_ROUNDS } from "../configs/constant";
import { HttpException } from "../exceptions/http-exception";
import {
  createUser,
  deleteUserById,
  findUserByEmail,
  findUserById,
  findUsers,
  updateUser,
} from "../repositories/user.repository";
import { toUserResponse } from "./user.service";

export type AdminUserInput = {
  fullName?: string;
  email?: string;
  password?: string;
  role?: "user" | "admin";
  status?: "active" | "inactive";
};

const validate = (input: AdminUserInput, creating: boolean) => {
  if (creating || input.fullName !== undefined) {
    if (!input.fullName || input.fullName.trim().length < 2) {
      throw new HttpException(400, "Full name must be at least 2 characters");
    }
  }
  if (creating || input.email !== undefined) {
    if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
      throw new HttpException(400, "A valid email is required");
    }
  }
  if ((creating || input.password !== undefined) && (!input.password || input.password.length < 6)) {
    throw new HttpException(400, "Password must be at least 6 characters");
  }
  if (input.role && !["user", "admin"].includes(input.role)) {
    throw new HttpException(400, "Role must be user or admin");
  }
  if (input.status && !["active", "inactive"].includes(input.status)) {
    throw new HttpException(400, "Status must be active or inactive");
  }
};

export const listAdminUsers = async (page: number, limit: number, search: string) => {
  const result = await findUsers({ page, limit, search });
  return {
    data: result.users.map(toUserResponse),
    meta: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    },
  };
};

export const getAdminUser = async (id: string) => {
  if (!isValidObjectId(id)) throw new HttpException(400, "Invalid user id");
  const user = await findUserById(id);
  if (!user) throw new HttpException(404, "User not found");
  return toUserResponse(user);
};

export const createAdminUser = async (input: AdminUserInput) => {
  validate(input, true);
  if (await findUserByEmail(input.email!)) throw new HttpException(409, "Email already exists");
  const user = await createUser({
    fullName: input.fullName!,
    email: input.email!,
    password: await bcrypt.hash(input.password!, BCRYPT_SALT_ROUNDS),
  });
  if (input.role || input.status) {
    const updated = await updateUser(user._id.toString(), {
      role: input.role ?? "user",
      status: input.status ?? "active",
    });
    return toUserResponse(updated!);
  }
  return toUserResponse(user);
};

export const updateAdminUser = async (id: string, input: AdminUserInput) => {
  if (!isValidObjectId(id)) throw new HttpException(400, "Invalid user id");
  validate(input, false);
  const current = await findUserById(id);
  if (!current) throw new HttpException(404, "User not found");
  if (input.email && input.email.toLowerCase().trim() !== current.email) {
    if (await findUserByEmail(input.email)) throw new HttpException(409, "Email already exists");
  }
  const update: AdminUserInput = { ...input };
  if (update.fullName) update.fullName = update.fullName.trim();
  if (update.email) update.email = update.email.toLowerCase().trim();
  if (update.password) update.password = await bcrypt.hash(update.password, BCRYPT_SALT_ROUNDS);
  else delete update.password;
  const user = await updateUser(id, update);
  return toUserResponse(user!);
};

export const removeAdminUser = async (id: string, requestingUserId: string) => {
  if (!isValidObjectId(id)) throw new HttpException(400, "Invalid user id");
  if (id === requestingUserId) throw new HttpException(400, "You cannot delete your own account");
  const deleted = await deleteUserById(id);
  if (!deleted) throw new HttpException(404, "User not found");
};
