import { Router } from "express";
import { getMyHistory } from "../controllers/activityController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.get("/my-history", authMiddleware, getMyHistory);

export default router;
