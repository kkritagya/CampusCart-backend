import { UserModel } from "../models/user.model";
import { IUserDocument } from "../types/user.type";

export const findUserByEmail = (email: string): Promise<IUserDocument | null> => {
  return UserModel.findOne({ email: email.toLowerCase().trim() });
};

export const findUserById = (id: string): Promise<IUserDocument | null> => {
  return UserModel.findById(id);
};

export const createUser = (user: {
  fullName: string;
  email: string;
  password: string;
}): Promise<IUserDocument> => {
  return UserModel.create({
    fullName: user.fullName.trim(),
    email: user.email.toLowerCase().trim(),
    password: user.password,
  });
};
