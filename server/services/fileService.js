import File from "../models/File.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import ApiError from "../utils/ApiError.js";
import { getFilePath } from "./storageService.js";
import * as activityService from "./activityService.js";

const createFileMetadata = async (payload) => {
  const file = await File.create(payload);
  return file;
};

const getUserFiles = async (userId) => {
  const files = await File.find({ ownerId: userId, isDeleted: false }).sort({
    uploadedAt: -1,
  });
  return files;
};

const getFileById = async (id) => {
  const file = await File.findById(id);
  return file;
};

export { createFileMetadata, getUserFiles, getFileById };

const searchFiles = async (userId, { name, mimeType, startDate, endDate }) => {
  const query = { ownerId: userId, isDeleted: false };

  if (name && typeof name === "string") {
    // partial, case-insensitive match
    query.originalName = { $regex: name, $options: "i" };
  }

  if (mimeType && typeof mimeType === "string") {
    query.mimeType = mimeType;
  }

  if (startDate) {
    const s = new Date(startDate);
    if (Number.isNaN(s.getTime())) {
      throw new ApiError(400, "Invalid startDate");
    }

    query.uploadedAt = { ...(query.uploadedAt || {}), $gte: s };
  }

  if (endDate) {
    const e = new Date(endDate);
    if (Number.isNaN(e.getTime())) {
      throw new ApiError(400, "Invalid endDate");
    }
    // include entire day for endDate
    e.setHours(23, 59, 59, 999);

    query.uploadedAt = { ...(query.uploadedAt || {}), $lte: e };
  }

  if (query.uploadedAt && query.uploadedAt.$gte && query.uploadedAt.$lte) {
    if (query.uploadedAt.$gte > query.uploadedAt.$lte) {
      throw new ApiError(400, "startDate cannot be after endDate");
    }
  }

  const files = await File.find(query).sort({ uploadedAt: -1 });
  return files;
};

export { searchFiles };

const downloadFile = async (fileId, userId) => {
  const file = await File.findById(fileId);

  if (!file || file.isDeleted) {
    throw new ApiError(404, "File not found");
  }

  if (file.ownerId.toString() !== userId.toString()) {
    throw new ApiError(403, "Access denied");
  }

  const primaryNode = file.primaryNode || file.nodeLocation;
  const replicaNode = file.replicaNode;

  const primaryPath = getFilePath(primaryNode, file.ownerId.toString(), file.storedName);
  const replicaPath = replicaNode
    ? getFilePath(replicaNode, file.ownerId.toString(), file.storedName)
    : null;

  // Try primary first
  if (primaryPath) {
    try {
      await fs.access(primaryPath);
      return {
        filePath: primaryPath,
        originalName: file.originalName,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
      };
    } catch (err) {
      // primary missing; fall through to try replica
      console.warn(`Primary missing for file ${fileId} at ${primaryPath}: ${err.message}`);
    }
  }

  // Try replica
  if (replicaPath) {
    try {
      await fs.access(replicaPath);
      // Log that replica was used for download
      try {
        await activityService.createActivity({ userId, action: "RECOVERY", fileId: file._id, fileName: file.originalName });
      } catch (e) {
        console.warn("Failed to log recovery activity", e);
      }

      return {
        filePath: replicaPath,
        originalName: file.originalName,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
      };
    } catch (err) {
      console.warn(`Replica missing for file ${fileId} at ${replicaPath}: ${err.message}`);
    }
  }

  throw new ApiError(404, "Physical file missing");
};

export { downloadFile };

const deleteFile = async (fileId, userId) => {
  const file = await File.findById(fileId);

  if (!file || file.isDeleted) {
    throw new ApiError(404, "File not found");
  }

  if (file.ownerId.toString() !== userId.toString()) {
    throw new ApiError(403, "Access denied");
  }

  const filePath = getFilePath(file.nodeLocation, file.ownerId.toString(), file.storedName);
  // Attempt to delete both primary and replica copies
  const primaryNode = file.primaryNode || file.nodeLocation;
  const replicaNode = file.replicaNode;

  const primaryPath = getFilePath(primaryNode, file.ownerId.toString(), file.storedName);
  const replicaPath = replicaNode
    ? getFilePath(replicaNode, file.ownerId.toString(), file.storedName)
    : null;

  const primaryResult = await fs.unlink(primaryPath).then(() => ({ deleted: true })).catch((e) => ({ error: e }));
  let replicaResult = null;
  if (replicaPath) {
    replicaResult = await fs.unlink(replicaPath).then(() => ({ deleted: true })).catch((e) => ({ error: e }));
  }

  const primaryErr = primaryResult.error;
  const replicaErr = replicaResult && replicaResult.error;

  // If both missing or both failed with ENOENT, treat as missing
  const primaryMissing = primaryErr && primaryErr.code === "ENOENT";
  const replicaMissing = replicaErr && replicaErr.code === "ENOENT";

  if ((primaryMissing || primaryErr) && (replicaMissing || replicaErr)) {
    throw new ApiError(404, "Physical file missing");
  }

  // If deletion for one node failed with other error, surface server error
  if ((primaryErr && primaryErr.code !== "ENOENT") || (replicaErr && replicaErr.code !== "ENOENT")) {
    throw new ApiError(500, "Failed to delete physical file");
  }

  file.isDeleted = true;
  file.deletedAt = new Date();
  await file.save();

  return true;
};

export { deleteFile };
