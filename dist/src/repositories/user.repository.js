"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProfilePicture = exports.createUser = exports.findUserById = exports.findUserByEmail = void 0;
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
    });
};
exports.createUser = createUser;
const updateUserProfilePicture = (id, profilePicture) => {
    return user_model_1.UserModel.findByIdAndUpdate(id, { profilePicture }, { new: true });
};
exports.updateUserProfilePicture = updateUserProfilePicture;
