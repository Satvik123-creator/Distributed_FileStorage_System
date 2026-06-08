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
import fs from "fs/promises";

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
    throw new ApiError(403, "Access denied");
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
  const primaryNode = await chooseNode();
  const storedName = generateUniqueFileName(req.file.originalname);

  let savedPath;

  try {
    // store primary copy
    savedPath = await storeFile({
      buffer: req.file.buffer,
      nodeLocation: primaryNode,
      userId,
      storedName,
    });

    // create replica on a different node
    const { replicaNode } = await replicationService.createReplica({
      buffer: req.file.buffer,
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
    });

    // Update node statistics after upload
    await updateNodeStats(primaryNode);
    await updateNodeStats(replicaNode);

    // Log upload activity (do not block response)
    logAction(req.user._id, "UPLOAD", {
      fileId: file._id,
      fileName: file.originalName,
    }).catch(() => {});

    return res.status(201).json(
      new ApiResponse(201, "File uploaded successfully", {
        fileId: file._id,
        primaryNode,
        replicaNode,
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

  const { filePath, originalName, mimeType } = await fileService.downloadFile(
    fileId,
    userId,
  );

  res.setHeader("Content-Type", mimeType || "application/octet-stream");
  return res.download(filePath, originalName, (err) => {
    if (err) {
      throw new ApiError(500, "Failed to download file");
    }
  });
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
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, "Search results", mapped));
});

export { getMyFiles, getFile, uploadFile, downloadFile, deleteFile, searchFiles };
