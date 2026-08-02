import { UserModel } from "../models/user.model";
import { IUserDocument, IUser } from "../types/user.type";

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
  phone?: string;
}): Promise<IUserDocument> => {
  return UserModel.create({
    fullName: user.fullName.trim(),
    email: user.email.toLowerCase().trim(),
    password: user.password,
    phone: user.phone?.trim() ?? "",
  });
};

export const updateUserProfilePicture = (
  id: string,
  profilePicture: string
): Promise<IUserDocument | null> => {
  return UserModel.findByIdAndUpdate(
    id,
    { profilePicture },
    { returnDocument: "after" }
  );
};

export const updateUser = (
  id: string,
  data: Partial<IUser>
): Promise<IUserDocument | null> => {
  return UserModel.findByIdAndUpdate(id, data, { returnDocument: "after" });
};

export const findUsers = async (options: {
  page: number;
  limit: number;
  search: string;
}): Promise<{ users: IUserDocument[]; total: number }> => {
  const filter = options.search
    ? {
        $or: [
          { fullName: { $regex: options.search, $options: "i" } },
          { email: { $regex: options.search, $options: "i" } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    UserModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit),
    UserModel.countDocuments(filter),
  ]);

  return { users, total };
};

export const deleteUserById = (id: string): Promise<IUserDocument | null> => {
  return UserModel.findByIdAndDelete(id);
};
