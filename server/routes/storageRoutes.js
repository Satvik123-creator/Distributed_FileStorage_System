import { Router } from "express";
import { healthCheck, repairFile } from "../controllers/storageController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.get("/health", authMiddleware, healthCheck);
router.post("/repair/:fileId", authMiddleware, repairFile);

export default router;
