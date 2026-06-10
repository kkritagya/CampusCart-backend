import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { BCRYPT_SALT_ROUNDS, JWT_EXPIRES_IN, JWT_SECRET } from "../configs/constant";
import { LoginUserDto, RegisterUserDto } from "../dtos/user.dto";
import { HttpException } from "../exceptions/http-exception";
import { createUser, findUserByEmail, findUserById } from "../repositories/user.repository";
import { IUserDocument, IUserResponse, JwtPayload } from "../types/user.type";

export const toUserResponse = (user: IUserDocument): IUserResponse => ({
  id: user._id.toString(),
  fullName: user.fullName,
  email: user.email,
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
