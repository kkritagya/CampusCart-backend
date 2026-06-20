import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import path from "path";
import { CLIENT_ORIGIN } from "./configs/constant";
import authRoutes from "./routes/user.route";
import { sendResponse } from "./utils/apihelper.util";

const app = express();

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (_req: Request, res: Response) => {
  return sendResponse(res, 200, true, "Campus backend API is running");
});

app.use("/api/auth", authRoutes);

app.use((_req: Request, res: Response) => {
  return sendResponse(res, 404, false, "Route not found");
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  return sendResponse(res, 500, false, error.message || "Internal server error");
});

export default app;
