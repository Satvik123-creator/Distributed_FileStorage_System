import { Router } from "express";
import { healthCheck, getStorageStats, repairFile, getFailoverLogsHandler, getFailoverStatsHandler } from "../controllers/storageController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.get("/health", authMiddleware, healthCheck);
router.get("/stats", authMiddleware, getStorageStats);
router.get("/failovers", authMiddleware, getFailoverLogsHandler);
router.get("/failovers/stats", authMiddleware, getFailoverStatsHandler);
router.post("/repair/:fileId", authMiddleware, repairFile);

export default router;
