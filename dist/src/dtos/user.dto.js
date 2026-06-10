"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLoginDto = exports.validateRegisterDto = void 0;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validateRegisterDto = (body) => {
    if (!body.fullName || body.fullName.trim().length < 2) {
        return "Full name must be at least 2 characters";
    }
    if (!body.email || !emailRegex.test(body.email.trim())) {
        return "A valid email is required";
    }
    if (!body.password || body.password.length < 6) {
        return "Password must be at least 6 characters";
    }
    return null;
};
exports.validateRegisterDto = validateRegisterDto;
const validateLoginDto = (body) => {
    if (!body.email || !emailRegex.test(body.email.trim())) {
        return "A valid email is required";
    }
    if (!body.password) {
        return "Password is required";
    }
    return null;
};
exports.validateLoginDto = validateLoginDto;
