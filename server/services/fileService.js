import mongoose from "mongoose";
import File from "../models/File.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import ApiError from "../utils/ApiError.js";
import { getFilePath } from "./storageService.js";
import * as activityService from "./activityService.js";
import { performFailover } from "./failoverService.js";
import { checkShareAccess } from "./shareService.js";
import { decrementReference } from "./dedupService.js";

const computeVersionInfo = async (ownerId, originalName) => {
  const existingFile = await File.findOne({
    ownerId,
    originalName,
    isDeleted: false,
    parentFileId: null,
  }).sort({ version: -1 });

  let version = 1;
  let parentFileId = null;
  let fileGroupId = new mongoose.Types.ObjectId();

  if (existingFile) {
    fileGroupId = existingFile.fileGroupId;
    const latestVersion = await File.findOne({ fileGroupId, isDeleted: false }).sort({ version: -1 });
    version = (latestVersion ? latestVersion.version : 0) + 1;
    parentFileId = existingFile._id;
  }

  return { version, parentFileId, fileGroupId };
};

const createFileMetadata = async (payload) => {
  const { ownerId, originalName } = payload;

  const versionInfo = await computeVersionInfo(ownerId, originalName);

  const file = await File.create({
    ...payload,
    version: versionInfo.version,
    parentFileId: versionInfo.parentFileId,
    fileGroupId: versionInfo.fileGroupId,
  });

  return file;
};

const getUserFiles = async (userId) => {
  const files = await File.find({
    ownerId: userId,
    isDeleted: false,
    parentFileId: null,
  }).sort({ uploadedAt: -1 });
  return files;
};

const getFileById = async (id) => {
  const file = await File.findById(id);
  return file;
};

const getFileVersions = async (fileId, userId) => {
  const file = await File.findById(fileId);
  if (!file || file.isDeleted) {
    throw new ApiError(404, "File not found");
  }
  if (file.ownerId.toString() !== userId.toString()) {
    throw new ApiError(403, "Access denied");
  }

  const groupId = file.fileGroupId || file._id;
  const versions = await File.find({
    fileGroupId: groupId,
    ownerId: userId,
    isDeleted: false,
  }).sort({ version: 1 });

  return versions;
};

const restoreVersion = async (versionId, userId) => {
  const versionFile = await File.findById(versionId);
  if (!versionFile || versionFile.isDeleted) {
    throw new ApiError(404, "Version not found");
  }
  if (versionFile.ownerId.toString() !== userId.toString()) {
    throw new ApiError(403, "Access denied");
  }

  const { version, parentFileId, fileGroupId } = await computeVersionInfo(userId, versionFile.originalName);

  const newStoredName = `${Date.now()}_${versionId}`;
  const srcPath = getFilePath(versionFile.nodeLocation, versionFile.ownerId.toString(), versionFile.storedName);
  const dstPath = getFilePath(versionFile.nodeLocation, versionFile.ownerId.toString(), newStoredName);

  await fs.copyFile(srcPath, dstPath);

  const buffer = await fs.readFile(dstPath);
  const { createReplica } = await import("./replicationService.js");
  const { replicaNode } = await createReplica({
    buffer,
    primaryNode: versionFile.nodeLocation,
    userId: userId.toString(),
    storedName: newStoredName,
    originalName: versionFile.originalName,
  });

  const newFile = await File.create({
    ownerId: userId,
    originalName: versionFile.originalName,
    storedName: newStoredName,
    nodeLocation: versionFile.nodeLocation,
    primaryNode: versionFile.nodeLocation,
    replicaNode,
    fileSize: versionFile.fileSize,
    mimeType: versionFile.mimeType,
    uploadedAt: new Date(),
    version,
    parentFileId,
    fileGroupId,
    fileHash: versionFile.fileHash,
    referenceCount: 1,
    encrypted: versionFile.encrypted,
    encryptionVersion: versionFile.encryptionVersion,
    encryptionIv: versionFile.encryptionIv,
  });

  const { updateNodeStats } = await import("./loadBalancerService.js");
  await updateNodeStats(versionFile.nodeLocation).catch(() => {});
  if (replicaNode) await updateNodeStats(replicaNode).catch(() => {});

  return newFile;
};

export { createFileMetadata, computeVersionInfo, getUserFiles, getFileById, getFileVersions, restoreVersion };

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
    const hasAccess = await checkShareAccess(fileId, userId, "download");
    if (!hasAccess) {
      throw new ApiError(403, "Access denied");
    }
  }

  const primaryNode = file.primaryNode || file.nodeLocation;
  const replicaNode = file.replicaNode;

  const primaryPath = getFilePath(primaryNode, file.ownerId.toString(), file.storedName);
  const replicaPath = replicaNode
    ? getFilePath(replicaNode, file.ownerId.toString(), file.storedName)
    : null;

  const result = {
    filePath: null,
    originalName: file.originalName,
    mimeType: file.mimeType,
    fileSize: file.fileSize,
    version: file.version,
    encrypted: file.encrypted || false,
    encryptionIv: file.encryptionIv || null,
    encryptionVersion: file.encryptionVersion || null,
  };

  // Try primary first
  if (primaryPath) {
    try {
      await fs.access(primaryPath);
      result.filePath = primaryPath;
      return result;
    } catch (err) {
      console.warn(`Primary missing for file ${fileId} at ${primaryPath}: ${err.message}`);
    }
  }

  // Try replica and trigger automatic failover if replica exists
  if (replicaPath) {
    try {
      await fs.access(replicaPath);
      result.filePath = replicaPath;

      // Automatic failover: promote replica to primary, create new replica
      try {
        await performFailover({ file, userId });
        console.log(`Failover completed for file ${fileId}: ${file.primaryNode} -> ${file.replicaNode}`);
      } catch (foErr) {
        console.error(`Failover failed for file ${fileId}: ${foErr.message}`);
      }

      return result;
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

  // Handle dedup reference: decrement source reference count
  const { physicalDeleted, sourceFile } = await decrementReference(file);

  if (physicalDeleted && sourceFile) {
    // This was the last reference — delete physical files
    const primaryNode = sourceFile.primaryNode || sourceFile.nodeLocation;
    const replicaNode = sourceFile.replicaNode;

    const primaryPath = getFilePath(primaryNode, sourceFile.ownerId.toString(), sourceFile.storedName);
    const replicaPath = replicaNode
      ? getFilePath(replicaNode, sourceFile.ownerId.toString(), sourceFile.storedName)
      : null;

    await fs.unlink(primaryPath).catch(() => {});
    if (replicaPath) {
      await fs.unlink(replicaPath).catch(() => {});
    }
  }

  // Mark this file as deleted
  file.isDeleted = true;
  file.deletedAt = new Date();
  await file.save();

  return file;
};

export { deleteFile };
