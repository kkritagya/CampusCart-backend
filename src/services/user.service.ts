import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { BCRYPT_SALT_ROUNDS, JWT_EXPIRES_IN, JWT_SECRET } from "../configs/constant";
import { LoginUserDto, RegisterUserDto } from "../dtos/user.dto";
import { HttpException } from "../exceptions/http-exception";
import { createUser, findUserByEmail, findUserById, updateUserProfilePicture, updateUser } from "../repositories/user.repository";
import { IUserDocument, IUserResponse, JwtPayload, IUser } from "../types/user.type";

export const toUserResponse = (user: IUserDocument): IUserResponse => ({
  id: user._id.toString(),
  fullName: user.fullName,
  email: user.email,
  role: user.role ?? "user",
  status: user.status ?? "active",
  profilePicture: user.profilePicture,
  phone: user.phone,
  address: user.address,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const registerUser = async (dto: RegisterUserDto): Promise<IUserResponse> => {
  const existingUser = await findUserByEmail(dto.email);

  if (existingUser) {
    throw new HttpException(409, "Email already exists");
  }

  const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
  const user = await createUser({
    fullName: dto.fullName,
    email: dto.email,
    password: hashedPassword,
    phone: dto.phone,
  });

  return toUserResponse(user);
};

export const loginUser = async (
  dto: LoginUserDto
): Promise<{ user: IUserResponse; token: string }> => {
  const user = await findUserByEmail(dto.email);

  if (!user) {
    throw new HttpException(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(dto.password, user.password);

  if (!isPasswordValid) {
    throw new HttpException(401, "Invalid email or password");
  }

  if (!JWT_SECRET) {
    throw new HttpException(500, "JWT_SECRET is missing in environment variables");
  }

  const payload: JwtPayload = { userId: user._id.toString() };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    user: toUserResponse(user),
    token,
  };
};

export const getUserById = async (userId: string): Promise<IUserResponse> => {
  const user = await findUserById(userId);

  if (!user) {
    throw new HttpException(404, "User not found");
  }

  return toUserResponse(user);
};

export const updateUserProfilePictureService = async (
  userId: string,
  profilePicturePath: string
): Promise<IUserResponse> => {
  const user = await updateUserProfilePicture(userId, profilePicturePath);

  if (!user) {
    throw new HttpException(404, "User not found");
  }

  return toUserResponse(user);
};

export const updateUserProfileService = async (
  userId: string,
  data: { fullName: string; phone?: string; address?: string; profilePicture?: string }
): Promise<IUserResponse> => {
  const existingUser = await findUserById(userId);
  if (!existingUser) {
    throw new HttpException(404, "User not found");
  }

  const updateData: Partial<IUser> = {
    fullName: data.fullName.trim(),
    phone: data.phone?.trim() ?? "",
    address: data.address?.trim() ?? "",
  };

  if (data.profilePicture) {
    updateData.profilePicture = data.profilePicture;
  }

  const updatedUser = await updateUser(userId, updateData);
  if (!updatedUser) {
    throw new HttpException(500, "Failed to update user profile");
  }

  return toUserResponse(updatedUser);
};

export const updateUserPasswordService = async (
  userId: string,
  currentPassword?: string,
  newPassword?: string
): Promise<void> => {
  if (!currentPassword || !newPassword) {
    throw new HttpException(400, "Current password and new password are required");
  }

  const user = await findUserById(userId);
  if (!user) {
    throw new HttpException(404, "User not found");
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new HttpException(400, "Incorrect current password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  const updatedUser = await updateUser(userId, { password: hashedPassword });
  if (!updatedUser) {
    throw new HttpException(500, "Failed to update password");
  }
};
