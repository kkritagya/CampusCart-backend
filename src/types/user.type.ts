import { Document, Types } from "mongoose";

export interface IUser {
  fullName: string;
  email: string;
  password: string;
  profilePicture?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
}

export interface IUserResponse {
  id: string;
  fullName: string;
  email: string;
  profilePicture?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JwtPayload {
  userId: string;
}
