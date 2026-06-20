import { Router } from "express";
import { getCurrentUser, login, logout, register, uploadProfilePictureController } from "../controllers/user.controller";
import { authorize } from "../middlewares/authorized.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authorize, getCurrentUser);
router.post("/logout", logout);
router.put("/profile-picture", authorize, upload.single("profilePicture"), uploadProfilePictureController);

export default router;
