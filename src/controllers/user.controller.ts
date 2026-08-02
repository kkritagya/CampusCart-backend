import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_COOKIE_NAME, JWT_SECRET } from "../configs/constant";
import { LoginUserDto, RegisterUserDto, validateLoginDto, validateRegisterDto } from "../dtos/user.dto";
import { HttpException } from "../exceptions/http-exception";
import { AuthRequest } from "../middlewares/authorized.middleware";
import { getUserById, loginUser, registerUser, updateUserProfilePictureService, updateUserProfileService, updateUserPasswordService } from "../services/user.service";
import { sendResponse } from "../utils/apihelper.util";
import {
  requestPasswordReset,
  resetPassword as resetPasswordService,
} from "../services/password-reset.service";
import {
  requestMobilePasswordReset,
  resetMobilePassword,
  verifyMobilePasswordResetOtp,
} from "../services/mobile-password-reset.service";

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
    let adminToken: string | undefined;
    if (req.body?.adminReauth === true) {
      if (user.role !== "admin" || user.status !== "active") {
        return sendResponse(res, 403, false, "Admin access required");
      }
      adminToken = jwt.sign(
        { userId: user.id, purpose: "admin" },
        JWT_SECRET,
        { expiresIn: "15m" }
      );
      res.cookie("admin_session", adminToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });
    }

    return sendResponse(res, 200, true, "Login successful", {
      user,
      token,
      ...(adminToken ? { adminToken } : {}),
    });
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
    res.clearCookie("admin_session", {
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

export const uploadProfilePictureController = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendResponse(res, 401, false, "Unauthorized");
    }

    if (!req.file) {
      return sendResponse(res, 400, false, "Please upload a file");
    }

    const profilePicturePath = `/uploads/profile_pics/${req.file.filename}`;
    const user = await updateUserProfilePictureService(req.user.id, profilePicturePath);

    return sendResponse(res, 200, true, "Profile picture uploaded successfully", user);
  } catch (error) {
    const statusCode = error instanceof HttpException ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : "Failed to upload profile picture";
    return sendResponse(res, statusCode, false, message);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendResponse(res, 401, false, "Unauthorized");
    }

    const { fullName, phone, address } = req.body;

    if (!fullName || fullName.trim().length < 2) {
      return sendResponse(res, 400, false, "Full name must be at least 2 characters");
    }

    let profilePicture: string | undefined = undefined;
    if (req.file) {
      profilePicture = `/uploads/profile_pics/${req.file.filename}`;
    }

    const user = await updateUserProfileService(req.user.id, {
      fullName,
      phone,
      address,
      profilePicture,
    });

    return sendResponse(res, 200, true, "Profile updated successfully", user);
  } catch (error) {
    const statusCode = error instanceof HttpException ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return sendResponse(res, statusCode, false, message);
  }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendResponse(res, 401, false, "Unauthorized");
    }

    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return sendResponse(res, 400, false, "New password must be at least 6 characters");
    }

    await updateUserPasswordService(req.user.id, currentPassword, newPassword);

    return sendResponse(res, 200, true, "Password updated successfully");
  } catch (error) {
    const statusCode = error instanceof HttpException ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : "Failed to update password";
    return sendResponse(res, statusCode, false, message);
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendResponse(res, 400, false, "A valid email is required");
    }
    await requestPasswordReset(email);
    return sendResponse(
      res,
      200,
      true,
      "If an account exists for that email, a reset link has been sent."
    );
  } catch (error) {
    const statusCode = error instanceof HttpException ? error.statusCode : 500;
    const message =
      error instanceof Error ? error.message : "Failed to request password reset";
    return sendResponse(res, statusCode, false, message);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    const newPassword =
      typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
    if (!token) return sendResponse(res, 400, false, "Reset token is required");
    if (newPassword.length < 8) {
      return sendResponse(
        res,
        400,
        false,
        "New password must be at least 8 characters"
      );
    }
    await resetPasswordService(token, newPassword);
    return sendResponse(res, 200, true, "Password reset successfully");
  } catch (error) {
    const statusCode = error instanceof HttpException ? error.statusCode : 500;
    const message = error instanceof Error ? error.message : "Password reset failed";
    return sendResponse(res, statusCode, false, message);
  }
};

export const forgotPasswordMobile = async (req: Request, res: Response) => {
  try {
    const email =
      typeof req.body?.email === "string" ? req.body.email.trim() : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendResponse(res, 400, false, "A valid email is required");
    }
    await requestMobilePasswordReset(email);
    return sendResponse(
      res,
      200,
      true,
      "If an account exists for that email, a 6-digit code has been sent."
    );
  } catch (error) {
    const statusCode =
      error instanceof HttpException ? error.statusCode : 500;
    const message =
      error instanceof Error ? error.message : "Failed to send reset code";
    return sendResponse(res, statusCode, false, message);
  }
};

export const verifyPasswordResetOtpMobile = async (
  req: Request,
  res: Response
) => {
  try {
    const email =
      typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const otp = typeof req.body?.otp === "string" ? req.body.otp.trim() : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return sendResponse(res, 400, false, "A valid email is required");
    }
    if (!/^\d{6}$/.test(otp)) {
      return sendResponse(res, 400, false, "Enter the 6-digit OTP");
    }
    const resetToken = await verifyMobilePasswordResetOtp(email, otp);
    return sendResponse(
      res,
      200,
      true,
      "OTP verified",
      { resetToken }
    );
  } catch (error) {
    const statusCode =
      error instanceof HttpException ? error.statusCode : 500;
    const message =
      error instanceof Error ? error.message : "Failed to verify reset code";
    return sendResponse(res, statusCode, false, message);
  }
};

export const resetPasswordMobile = async (req: Request, res: Response) => {
  try {
    const email =
      typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const resetToken =
      typeof req.body?.resetToken === "string" ? req.body.resetToken : "";
    const newPassword =
      typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
    if (!email || !resetToken) {
      return sendResponse(res, 400, false, "Reset session is required");
    }
    if (newPassword.length < 8) {
      return sendResponse(
        res,
        400,
        false,
        "New password must be at least 8 characters"
      );
    }
    await resetMobilePassword(email, resetToken, newPassword);
    return sendResponse(res, 200, true, "Password reset successfully");
  } catch (error) {
    const statusCode =
      error instanceof HttpException ? error.statusCode : 500;
    const message =
      error instanceof Error ? error.message : "Password reset failed";
    return sendResponse(res, statusCode, false, message);
  }
};
