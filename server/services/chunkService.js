import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import UploadSession from "../models/UploadSession.js";
import ApiError from "../utils/ApiError.js";
import chooseNode from "../utils/chooseNode.js";
import * as fileService from "../services/fileService.js";
import * as replicationService from "../services/replicationService.js";
import { generateUniqueFileName, storeFile } from "./storageService.js";
import { updateNodeStats } from "./loadBalancerService.js";
import { updateStorageUsed } from "./quotaService.js";
import { logAction } from "../utils/logService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageRoot = path.resolve(__dirname, "..", "storage");
const CHUNK_SIZE = 5 * 1024 * 1024;

const getTempDir = (uploadId) => path.join(storageRoot, "temp", uploadId);

const initUpload = async ({ userId, originalName, fileSize, mimeType, fileHash }) => {
  const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
  const uploadId = randomUUID();
  const tempDir = getTempDir(uploadId);

  await fs.mkdir(tempDir, { recursive: true });

  const session = await UploadSession.create({
    uploadId,
    userId,
    originalName,
    fileSize,
    mimeType,
    totalChunks,
    chunkSize: CHUNK_SIZE,
    fileHash: fileHash || null,
    status: "initiated",
    tempDir,
  });

  return {
    uploadId: session.uploadId,
    totalChunks: session.totalChunks,
    chunkSize: session.chunkSize,
    fileSize: session.fileSize,
  };
};

const uploadChunk = async ({ uploadId, chunkIndex, chunkBuffer, chunkHash }) => {
  const session = await UploadSession.findOne({ uploadId });
  if (!session) {
    throw new ApiError(404, "Upload session not found");
  }
  if (session.status === "completed") {
    throw new ApiError(400, "Upload already completed");
  }
  if (session.status === "failed") {
    throw new ApiError(400, "Upload session has failed");
  }
  if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
    throw new ApiError(400, `Invalid chunk index. Must be 0-${session.totalChunks - 1}`);
  }
  if (session.receivedChunks.includes(chunkIndex)) {
    return { chunkIndex, alreadyReceived: true };
  }

  if (chunkHash) {
    const computedHash = crypto.createHash("sha256").update(chunkBuffer).digest("hex");
    if (computedHash !== chunkHash) {
      throw new ApiError(400, `Chunk ${chunkIndex} hash mismatch`);
    }
  }

  const tempDir = getTempDir(uploadId);
  await fs.mkdir(tempDir, { recursive: true });
  const chunkPath = path.join(tempDir, String(chunkIndex));
  await fs.writeFile(chunkPath, chunkBuffer);

  session.receivedChunks.push(chunkIndex);
  if (session.status === "initiated") {
    session.status = "uploading";
  }
  await session.save();

  return {
    chunkIndex,
    alreadyReceived: false,
    receivedCount: session.receivedChunks.length,
    totalChunks: session.totalChunks,
  };
};

const getUploadStatus = async (uploadId) => {
  const session = await UploadSession.findOne({ uploadId });
  if (!session) {
    throw new ApiError(404, "Upload session not found");
  }

  const missingChunks = [];
  for (let i = 0; i < session.totalChunks; i++) {
    if (!session.receivedChunks.includes(i)) {
      missingChunks.push(i);
    }
  }

  return {
    uploadId: session.uploadId,
    originalName: session.originalName,
    fileSize: session.fileSize,
    totalChunks: session.totalChunks,
    receivedChunks: [...session.receivedChunks].sort((a, b) => a - b),
    missingChunks,
    status: session.status,
    progress: session.totalChunks > 0
      ? Math.round((session.receivedChunks.length / session.totalChunks) * 100)
      : 0,
  };
};

const completeUpload = async (uploadId, userId) => {
  const session = await UploadSession.findOne({ uploadId });
  if (!session) {
    throw new ApiError(404, "Upload session not found");
  }
  if (session.status === "completed") {
    throw new ApiError(400, "Upload already completed");
  }
  if (session.receivedChunks.length !== session.totalChunks) {
    const missing = session.totalChunks - session.receivedChunks.length;
    throw new ApiError(400, `Upload incomplete. ${missing} chunks missing`);
  }

  const tempDir = getTempDir(uploadId);
  const sortedChunks = [];
  for (let i = 0; i < session.totalChunks; i++) {
    const chunkPath = path.join(tempDir, String(i));
    const data = await fs.readFile(chunkPath);
    sortedChunks.push(data);
  }

  const fullBuffer = Buffer.concat(sortedChunks);

  if (session.fileHash) {
    const computedHash = crypto.createHash("sha256").update(fullBuffer).digest("hex");
    if (computedHash !== session.fileHash) {
      await cleanupTempDir(tempDir);
      session.status = "failed";
      await session.save();
      throw new ApiError(400, "Final file hash mismatch. File may be corrupted.");
    }
  }

  // Store assembled file to primary and replica nodes
  const primaryNode = await chooseNode();
  const storedName = generateUniqueFileName(session.originalName);

  try {
    await storeFile({
      buffer: fullBuffer,
      nodeLocation: primaryNode,
      userId,
      storedName,
    });

    const { replicaNode } = await replicationService.createReplica({
      buffer: fullBuffer,
      primaryNode,
      userId,
      storedName,
      originalName: session.originalName,
    });

    const file = await fileService.createFileMetadata({
      ownerId: userId,
      originalName: session.originalName,
      storedName,
      nodeLocation: primaryNode,
      primaryNode,
      replicaNode,
      fileSize: session.fileSize,
      mimeType: session.mimeType,
      uploadedAt: new Date(),
    });

    await updateNodeStats(primaryNode);
    await updateNodeStats(replicaNode);
    await updateStorageUsed(userId);

    session.status = "completed";
    session.storedName = storedName;
    session.primaryNode = primaryNode;
    session.replicaNode = replicaNode;
    await session.save();

    logAction(userId, "UPLOAD", {
      fileId: file._id,
      fileName: file.originalName,
      chunked: true,
    }).catch(() => {});

    await cleanupTempDir(tempDir);

    return {
      fileId: file._id,
      originalName: file.originalName,
      fileSize: file.fileSize,
      primaryNode,
      replicaNode,
      version: file.version,
      fileGroupId: file.fileGroupId,
      totalChunks: session.totalChunks,
    };
  } catch (error) {
    session.status = "failed";
    await session.save();
    await cleanupTempDir(tempDir);
    throw error;
  }
};

const cancelUpload = async (uploadId, userId) => {
  const session = await UploadSession.findOne({ uploadId });
  if (!session) {
    throw new ApiError(404, "Upload session not found");
  }
  if (session.userId.toString() !== userId.toString()) {
    throw new ApiError(403, "Access denied");
  }

  session.status = "failed";
  await session.save();

  const tempDir = getTempDir(uploadId);
  await cleanupTempDir(tempDir);

  return { uploadId, status: "cancelled" };
};

const cleanupTempDir = async (dir) => {
  try {
    const entries = await fs.readdir(dir);
    for (const entry of entries) {
      await fs.unlink(path.join(dir, entry)).catch(() => {});
    }
    await fs.rmdir(dir).catch(() => {});
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error("Temp cleanup error:", err.message);
    }
  }
};

export { initUpload, uploadChunk, getUploadStatus, completeUpload, cancelUpload, CHUNK_SIZE };
