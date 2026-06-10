import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_COOKIE_NAME, JWT_SECRET } from "../configs/constant";
import { HttpException } from "../exceptions/http-exception";
import { findUserById } from "../repositories/user.repository";
import { JwtPayload } from "../types/user.type";
import { sendResponse } from "../utils/apihelper.util";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}

const getCookieValue = (cookieHeader: string | undefined, cookieName: string): string | null => {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const cookie = cookies.find((item) => item.startsWith(`${cookieName}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
};

const getBearerToken = (authHeader: string | undefined): string | null => {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  return token || null;
};

export const authorize = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token =
      getCookieValue(req.headers.cookie, JWT_COOKIE_NAME) ??
      getBearerToken(req.headers.authorization);

    if (!token) {
      throw new HttpException(401, "Unauthorized: token is missing");
    }

    if (!JWT_SECRET) {
      throw new HttpException(500, "JWT_SECRET is missing in environment variables");
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = await findUserById(decoded.userId);

    if (!user) {
      throw new HttpException(401, "Unauthorized: user no longer exists");
    }

    req.user = {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
    };

    next();
  } catch (error) {
    const statusCode = error instanceof HttpException ? error.statusCode : 401;
    const message = error instanceof Error ? error.message : "Unauthorized";
    return sendResponse(res, statusCode, false, message);
  }
};
