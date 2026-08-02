import { Router } from "express";
import { forgotPassword, forgotPasswordMobile, getCurrentUser, login, logout, register, resetPassword, resetPasswordMobile, uploadProfilePictureController, updateProfile, updatePassword, verifyPasswordResetOtpMobile } from "../controllers/user.controller";
import { authorize } from "../middlewares/authorized.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authorize, getCurrentUser);
router.get("/whoami", authorize, getCurrentUser);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/mobile/forgot-password", forgotPasswordMobile);
router.post("/mobile/verify-reset-otp", verifyPasswordResetOtpMobile);
router.post("/mobile/reset-password", resetPasswordMobile);
router.put("/profile-picture", authorize, upload.single("profilePicture"), uploadProfilePictureController);
router.put("/update", authorize, upload.single("profilePicture"), updateProfile);
router.put("/password", authorize, updatePassword);

export default router;
