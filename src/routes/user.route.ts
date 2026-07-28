import { Router } from "express";
import { forgotPassword, getCurrentUser, login, logout, register, resetPassword, uploadProfilePictureController, updateProfile, updatePassword } from "../controllers/user.controller";
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
router.put("/profile-picture", authorize, upload.single("profilePicture"), uploadProfilePictureController);
router.put("/update", authorize, upload.single("profilePicture"), updateProfile);
router.put("/password", authorize, updatePassword);

export default router;
