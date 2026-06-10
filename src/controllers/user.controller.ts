import { Request, Response } from "express";
import { JWT_COOKIE_NAME } from "../configs/constant";
import { LoginUserDto, RegisterUserDto, validateLoginDto, validateRegisterDto } from "../dtos/user.dto";
import { HttpException } from "../exceptions/http-exception";
import { AuthRequest } from "../middlewares/authorized.middleware";
import { getUserById, loginUser, registerUser } from "../services/user.service";
import { sendResponse } from "../utils/apihelper.util";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" as const : "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req: Request, res: Response) => {
  try {
    const validationError = validateRegisterDto(req.body);

    if (validationError) {
      return sendResponse(res, 400, false, validationError);
    }

    const user = await registerUser(req.body as RegisterUserDto);
    return sendResponse(res, 201, true, "User registered successfully", user);
  } catch (error) {
    const statusCode = error instanceof HttpException ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : "Registration failed";
    return sendResponse(res, statusCode, false, message);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const validationError = validateLoginDto(req.body);

    if (validationError) {
      return sendResponse(res, 400, false, validationError);
    }

    const { user, token } = await loginUser(req.body as LoginUserDto);
    res.cookie(JWT_COOKIE_NAME, token, cookieOptions);

    return sendResponse(res, 200, true, "Login successful", { user, token });
  } catch (error) {
    const statusCode = error instanceof HttpException ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : "Login failed";
    return sendResponse(res, statusCode, false, message);
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendResponse(res, 401, false, "Unauthorized");
    }

    const user = await getUserById(req.user.id);
    return sendResponse(res, 200, true, "Current user fetched successfully", user);
  } catch (error) {
    const statusCode = error instanceof HttpException ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : "Failed to fetch current user";
    return sendResponse(res, statusCode, false, message);
  }
};

export const logout = async (_req: Request, res: Response) => {
  try {
    res.clearCookie(JWT_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return sendResponse(res, 200, true, "Logout successful");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Logout failed";
    return sendResponse(res, 500, false, message);
  }
};
