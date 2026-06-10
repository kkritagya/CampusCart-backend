import { Router } from "express";
import { getCurrentUser, login, logout, register } from "../controllers/user.controller";
import { authorize } from "../middlewares/authorized.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authorize, getCurrentUser);
router.post("/logout", logout);

export default router;
