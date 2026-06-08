import { Router } from "express";
import {
  getProfile,
  loginUser,
  registerUser,
  getStorageInfo,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", authMiddleware, getProfile);
router.get("/storage", authMiddleware, getStorageInfo);

export default router;
