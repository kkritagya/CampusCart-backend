import { Router } from "express";
import { addUser, deleteUser, editUser, listUsers, viewUser } from "../controllers/admin-user.controller";
import { authorize, requireAdmin } from "../middlewares/authorized.middleware";

const router = Router();
router.use(authorize, requireAdmin);
router.get("/", listUsers);
router.get("/:id", viewUser);
router.post("/", addUser);
router.put("/:id", editUser);
router.patch("/:id", editUser);
router.delete("/:id", deleteUser);

export default router;
