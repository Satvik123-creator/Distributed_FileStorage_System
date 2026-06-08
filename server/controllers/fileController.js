import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as fileService from "../services/fileService.js";
import * as replicationService from "../services/replicationService.js";
import { logAction } from "../utils/logService.js";
import chooseNode from "../utils/chooseNode.js";
import {
  generateUniqueFileName,
  storeFile,
} from "../services/storageService.js";
import { updateNodeStats } from "../services/loadBalancerService.js";
import { checkQuota, updateStorageUsed } from "../services/quotaService.js";
import { checkShareAccess } from "../services/shareService.js";
import { calculateHash, findExistingByHash, createDedupReference } from "../services/dedupService.js";
import { encryptBuffer, decryptBuffer } from "../services/encryptionService.js";
import fs from "fs/promises";
import path from "path";

const getMyFiles = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const files = await fileService.getUserFiles(userId);
  const mapped = files.map((f) => ({
    fileId: f._id,
    originalName: f.originalName,
    fileSize: f.fileSize,
    mimeType: f.mimeType,
    nodeLocation: f.nodeLocation,
    uploadedAt: f.uploadedAt,
    version: f.version,
    fileGroupId: f.fileGroupId,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, "Files fetched successfully", { files: mapped }));
});

const getFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const file = await fileService.getFileById(id);

  if (!file || file.isDeleted) {
    throw new ApiError(404, "File not found");
  }

  if (file.ownerId.toString() !== userId.toString()) {
    const hasAccess = await checkShareAccess(id, userId, "view");
    if (!hasAccess) {
      throw new ApiError(403, "Access denied");
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "File fetched successfully", { file }));
});

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "File is required");
  }

  const userId = req.user._id.toString();

  // Check storage quota before proceeding
  await checkQuota(userId, req.file.size);

  const fileHash = calculateHash(req.file.buffer);
  const existingFile = await findExistingByHash(fileHash);

  // Compute version info (file name based) before deciding dedup path
  const versionInfo = await fileService.computeVersionInfo(
    req.user._id,
    req.file.originalname,
  );

  if (existingFile) {
    // Dedup: no physical copy needed
    const file = await createDedupReference({
      sourceFile: existingFile,
      ownerId: req.user._id,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      version: versionInfo.version,
      parentFileId: versionInfo.parentFileId,
      fileGroupId: versionInfo.fileGroupId,
    });

    await updateStorageUsed(req.user._id);

    const logActionName = file.version > 1 ? "VERSION_CREATE" : "UPLOAD";
    logAction(req.user._id, logActionName, {
      fileId: file._id,
      fileName: file.originalName,
    }).catch(() => {});

    return res.status(201).json(
      new ApiResponse(201, "File uploaded successfully (deduplicated)", {
        fileId: file._id,
        primaryNode: file.primaryNode,
        replicaNode: file.replicaNode,
        version: file.version,
        fileGroupId: file.fileGroupId,
        isVersion: file.version > 1,
        deduplicated: true,
      }),
    );
  }

  // No existing hash — store physical copy
  const primaryNode = await chooseNode();
  const storedName = generateUniqueFileName(req.file.originalname);

  // Encrypt the file buffer before storing
  const { encryptedBuffer, encryptionIv, encryptionVersion } = await encryptBuffer(
    req.file.buffer,
    userId,
  );

  let savedPath;

  try {
    savedPath = await storeFile({
      buffer: encryptedBuffer,
      nodeLocation: primaryNode,
      userId,
      storedName,
    });

    const { replicaNode } = await replicationService.createReplica({
      buffer: encryptedBuffer,
      primaryNode,
      userId,
      storedName,
      originalName: req.file.originalname,
    });

    const file = await fileService.createFileMetadata({
      ownerId: req.user._id,
      originalName: req.file.originalname,
      storedName,
      nodeLocation: primaryNode,
      primaryNode,
      replicaNode,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date(),
      fileHash,
      referenceCount: 1,
      encrypted: true,
      encryptionVersion,
      encryptionIv,
    });

    await updateNodeStats(primaryNode);
    await updateNodeStats(replicaNode);
    await updateStorageUsed(req.user._id);

    const logActionName = file.version > 1 ? "VERSION_CREATE" : "UPLOAD";
    logAction(req.user._id, logActionName, {
      fileId: file._id,
      fileName: file.originalName,
      encrypted: true,
    }).catch(() => {});

    return res.status(201).json(
      new ApiResponse(201, "File uploaded successfully", {
        fileId: file._id,
        primaryNode,
        replicaNode,
        version: file.version,
        fileGroupId: file.fileGroupId,
        isVersion: file.version > 1,
        deduplicated: false,
        encrypted: true,
      }),
    );
  } catch (error) {
    if (savedPath) {
      await fs.unlink(savedPath).catch(() => {});
    }

    throw error;
  }
});

const downloadFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  const userId = req.user._id.toString();

  const { filePath, originalName, mimeType, version, encrypted, encryptionIv } = await fileService.downloadFile(
    fileId,
    userId,
  );

  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  const displayName = version > 1 ? `${base}_v${version}${ext}` : originalName;

  if (encrypted && encryptionIv) {
    const encryptedData = await fs.readFile(filePath);
    const decrypted = await decryptBuffer(encryptedData, encryptionIv, userId);

    res.setHeader("Content-Type", mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${displayName}"`);
    res.setHeader("Content-Length", decrypted.length);
    return res.send(decrypted);
  }

  res.setHeader("Content-Type", mimeType || "application/octet-stream");
  return res.download(filePath, displayName, (err) => {
    if (err) {
      throw new ApiError(500, "Failed to download file");
    }
  });
});

const getFileVersions = asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  const userId = req.user._id.toString();

  const versions = await fileService.getFileVersions(fileId, userId);
  const mapped = versions.map((v) => ({
    fileId: v._id,
    originalName: v.originalName,
    fileSize: v.fileSize,
    mimeType: v.mimeType,
    nodeLocation: v.nodeLocation,
    uploadedAt: v.uploadedAt,
    version: v.version,
    parentFileId: v.parentFileId,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, "File versions fetched", { versions: mapped }));
});

const deleteFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  const userId = req.user._id.toString();

  const file = await fileService.deleteFile(fileId, userId);

  // Update node statistics after deletion
  if (file) {
    await updateNodeStats(file.primaryNode).catch(() => {});
    if (file.replicaNode) {
      await updateNodeStats(file.replicaNode).catch(() => {});
    }
  }

  // Recalculate user storage used
  await updateStorageUsed(req.user._id).catch(() => {});

  // Log delete activity
  logAction(req.user._id, "DELETE", { fileId, fileName: null }).catch(() => {});

  return res
    .status(200)
    .json(new ApiResponse(200, "File deleted successfully", null));
});

const searchFiles = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { name, mimeType, startDate, endDate } = req.query;

  const files = await fileService.searchFiles(userId, {
    name,
    mimeType,
    startDate,
    endDate,
  });

  // Log search activity (non-blocking)
  logAction(req.user._id, "SEARCH").catch(() => {});

  const mapped = files.map((f) => ({
    fileId: f._id,
    originalName: f.originalName,
    fileSize: f.fileSize,
    mimeType: f.mimeType,
    nodeLocation: f.nodeLocation,
    uploadedAt: f.uploadedAt,
    version: f.version,
    fileGroupId: f.fileGroupId,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, "Search results", mapped));
});

const restoreVersion = asyncHandler(async (req, res) => {
  const { versionId } = req.params;
  const userId = req.user._id;

  const newFile = await fileService.restoreVersion(versionId, userId);

  logAction(req.user._id, "VERSION_CREATE", {
    fileId: newFile._id,
    fileName: newFile.originalName,
  }).catch(() => {});

  return res.status(201).json(
    new ApiResponse(201, "Version restored successfully", {
      fileId: newFile._id,
      originalName: newFile.originalName,
      version: newFile.version,
      fileSize: newFile.fileSize,
      uploadedAt: newFile.uploadedAt,
    }),
  );
});

export { getMyFiles, getFile, uploadFile, downloadFile, deleteFile, searchFiles, getFileVersions, restoreVersion };
