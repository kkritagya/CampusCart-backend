import { Response } from "express";
import { HttpException } from "../exceptions/http-exception";
import { AuthRequest } from "../middlewares/authorized.middleware";
import {
  createAdminUser,
  getAdminUser,
  listAdminUsers,
  removeAdminUser,
  updateAdminUser,
} from "../services/admin-user.service";
import { sendResponse } from "../utils/apihelper.util";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../configs/constant";
import { findUserById } from "../repositories/user.repository";

const fail = (res: Response, error: unknown) =>
  sendResponse(
    res,
    error instanceof HttpException ? error.statusCode : 500,
    false,
    error instanceof Error ? error.message : "Admin user operation failed"
  );

export const verifyAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const user = req.user ? await findUserById(req.user.id) : null;
    if (!user || !password || !(await bcrypt.compare(password, user.password))) {
      return sendResponse(res, 401, false, "Incorrect password");
    }
    if (!JWT_SECRET) throw new HttpException(500, "JWT_SECRET is missing");

    const token = jwt.sign(
      { userId: user._id.toString(), purpose: "admin" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );
    res.cookie("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    });
    return sendResponse(res, 200, true, "Admin access verified");
  } catch (error) {
    return fail(res, error);
  }
};

export const listUsers = async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? "10"), 10) || 10));
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    return res.json(await listAdminUsers(page, limit, search));
  } catch (error) { return fail(res, error); }
};

export const viewUser = async (req: AuthRequest, res: Response) => {
  try { return res.json(await getAdminUser(String(req.params.id))); }
  catch (error) { return fail(res, error); }
};

export const addUser = async (req: AuthRequest, res: Response) => {
  try { return res.status(201).json(await createAdminUser(req.body)); }
  catch (error) { return fail(res, error); }
};

export const editUser = async (req: AuthRequest, res: Response) => {
  try { return res.json(await updateAdminUser(String(req.params.id), req.body)); }
  catch (error) { return fail(res, error); }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    await removeAdminUser(String(req.params.id), req.user!.id);
    return res.status(204).send();
  } catch (error) { return fail(res, error); }
};
