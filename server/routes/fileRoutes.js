import { Router } from "express";
import {
  getFile,
  getMyFiles,
  uploadFile,
  downloadFile,
  deleteFile,
  searchFiles,
  getFileVersions,
} from "../controllers/fileController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = Router();

router.post("/upload", authMiddleware, upload.single("file"), uploadFile);
router.get("/my-files", authMiddleware, getMyFiles);
router.get("/search", authMiddleware, searchFiles);
router.get("/download/:fileId", authMiddleware, downloadFile);
router.get("/versions/:fileId", authMiddleware, getFileVersions);
router.delete("/:fileId", authMiddleware, deleteFile);
router.get("/:id", authMiddleware, getFile);

export default router;
