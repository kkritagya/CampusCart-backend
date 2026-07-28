import mongoose from "mongoose";
import { ADMIN_EMAIL, MONGO_URI } from "../configs/constant";
import { UserModel } from "../models/user.model";

export const connectDatabase = async (): Promise<void> => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is missing in environment variables");
    }

    await mongoose.connect(MONGO_URI);
    if (ADMIN_EMAIL) {
      await UserModel.updateOne(
        { email: ADMIN_EMAIL },
        { $set: { role: "admin", status: "active" } }
      );
    }
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  }
};
