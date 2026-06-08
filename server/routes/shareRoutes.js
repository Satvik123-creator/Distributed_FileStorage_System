import { Router } from "express";
import {
  shareFile,
  getSharedWithMe,
  getSharedByMe,
  removeShare,
  getFileShares,
} from "../controllers/shareController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", authMiddleware, shareFile);
router.get("/shared-with-me", authMiddleware, getSharedWithMe);
router.get("/shared-by-me", authMiddleware, getSharedByMe);
router.get("/file-shares/:fileId", authMiddleware, getFileShares);
router.delete("/:id", authMiddleware, removeShare);

export default router;
