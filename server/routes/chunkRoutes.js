import { Router } from "express";
import multer from "multer";
import {
  initUpload,
  uploadChunk,
  getUploadStatus,
  completeUpload,
  cancelUpload,
} from "../controllers/chunkController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const chunkUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.post("/init", authMiddleware, initUpload);
router.post("/upload", authMiddleware, chunkUpload.single("chunk"), uploadChunk);
router.get("/status/:uploadId", authMiddleware, getUploadStatus);
router.post("/complete/:uploadId", authMiddleware, completeUpload);
router.post("/cancel/:uploadId", authMiddleware, cancelUpload);

export default router;
