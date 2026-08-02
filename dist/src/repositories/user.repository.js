"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserById = exports.findUsers = exports.updateUser = exports.updateUserProfilePicture = exports.createUser = exports.findUserById = exports.findUserByEmail = void 0;
const user_model_1 = require("../models/user.model");
const findUserByEmail = (email) => {
    return user_model_1.UserModel.findOne({ email: email.toLowerCase().trim() });
};
exports.findUserByEmail = findUserByEmail;
const findUserById = (id) => {
    return user_model_1.UserModel.findById(id);
};
exports.findUserById = findUserById;
const createUser = (user) => {
    return user_model_1.UserModel.create({
        fullName: user.fullName.trim(),
        email: user.email.toLowerCase().trim(),
        password: user.password,
        phone: user.phone?.trim() ?? "",
    });
};
exports.createUser = createUser;
const updateUserProfilePicture = (id, profilePicture) => {
    return user_model_1.UserModel.findByIdAndUpdate(id, { profilePicture }, { returnDocument: "after" });
};
exports.updateUserProfilePicture = updateUserProfilePicture;
const updateUser = (id, data) => {
    return user_model_1.UserModel.findByIdAndUpdate(id, data, { returnDocument: "after" });
};
exports.updateUser = updateUser;
const findUsers = async (options) => {
    const filter = options.search
        ? {
            $or: [
                { fullName: { $regex: options.search, $options: "i" } },
                { email: { $regex: options.search, $options: "i" } },
            ],
        }
        : {};
    const [users, total] = await Promise.all([
        user_model_1.UserModel.find(filter)
            .sort({ createdAt: -1 })
            .skip((options.page - 1) * options.limit)
            .limit(options.limit),
        user_model_1.UserModel.countDocuments(filter),
    ]);
    return { users, total };
};
exports.findUsers = findUsers;
const deleteUserById = (id) => {
    return user_model_1.UserModel.findByIdAndDelete(id);
};
exports.deleteUserById = deleteUserById;
