import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import path from "path";
import { CLIENT_ORIGIN } from "./configs/constant";
import authRoutes from "./routes/user.route";
import listingRoutes from "./routes/listing.route";
import savedListingRoutes from "./routes/saved-listing.route";
import conversationRoutes from "./routes/conversation.route";
import { sendResponse } from "./utils/apihelper.util";
import { HttpException } from "./exceptions/http-exception";
import adminUserRoutes from "./routes/admin-user.route";
import cartRoutes from "./routes/cart.route";
import adminListingRoutes from "./routes/admin-listing.route";
import notificationRoutes from "./routes/notification.route";

const app = express();

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/", (_req: Request, res: Response) => {
  return sendResponse(res, 200, true, "Campus backend API is running");
});

// Keep the original mobile routes and the versioned web routes compatible.
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/saved", savedListingRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/listings", listingRoutes);
app.use("/api/v1/saved", savedListingRoutes);
app.use("/api/v1/conversations", conversationRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/admin/users", adminUserRoutes);
app.use("/api/v1/admin/listings", adminListingRoutes);

app.use((_req: Request, res: Response) => {
  return sendResponse(res, 404, false, "Route not found");
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = error instanceof HttpException ? error.statusCode : 500;
  return sendResponse(
    res,
    statusCode,
    false,
    error.message || "Internal server error"
  );
});

export default app;
