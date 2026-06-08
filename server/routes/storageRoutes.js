import { Router } from "express";
import { healthCheck, getStorageStats, repairFile, getFailoverLogsHandler, getFailoverStatsHandler, getDedupStatsHandler, getEncryptionStatusHandler, getGrowthData, recordSnapshot } from "../controllers/storageController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.get("/health", authMiddleware, healthCheck);
router.get("/stats", authMiddleware, getStorageStats);
router.get("/failovers", authMiddleware, getFailoverLogsHandler);
router.get("/failovers/stats", authMiddleware, getFailoverStatsHandler);
router.get("/dedup-stats", authMiddleware, getDedupStatsHandler);
router.get("/encryption/status", authMiddleware, getEncryptionStatusHandler);
router.post("/repair/:fileId", authMiddleware, repairFile);
router.get("/growth", authMiddleware, getGrowthData);
router.post("/snapshot", authMiddleware, recordSnapshot);

export default router;
