import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as chunkService from "../services/chunkService.js";
import { checkQuota } from "../services/quotaService.js";

const initUpload = asyncHandler(async (req, res) => {
  const { originalName, fileSize, mimeType, fileHash } = req.body;

  if (!originalName || !fileSize || !mimeType) {
    throw new ApiError(400, "originalName, fileSize, and mimeType are required");
  }
  if (fileSize <= 0) {
    throw new ApiError(400, "fileSize must be greater than 0");
  }

  await checkQuota(req.user._id, fileSize);

  const result = await chunkService.initUpload({
    userId: req.user._id,
    originalName,
    fileSize,
    mimeType,
    fileHash: fileHash || null,
  });

  return res.status(201).json(new ApiResponse(201, "Upload initialised", result));
});

const uploadChunk = asyncHandler(async (req, res) => {
  const { uploadId, chunkIndex, chunkHash } = req.body;

  if (!uploadId || chunkIndex === undefined || chunkIndex === null) {
    throw new ApiError(400, "uploadId and chunkIndex are required");
  }
  if (!req.file) {
    throw new ApiError(400, "Chunk file is required");
  }

  const result = await chunkService.uploadChunk({
    uploadId,
    chunkIndex: Number(chunkIndex),
    chunkBuffer: req.file.buffer,
    chunkHash: chunkHash || null,
  });

  return res.status(200).json(new ApiResponse(200, "Chunk uploaded", result));
});

const getUploadStatus = asyncHandler(async (req, res) => {
  const { uploadId } = req.params;
  const status = await chunkService.getUploadStatus(uploadId);
  return res.status(200).json(new ApiResponse(200, "Upload status", status));
});

const completeUpload = asyncHandler(async (req, res) => {
  const { uploadId } = req.params;
  const result = await chunkService.completeUpload(uploadId, req.user._id);
  return res.status(200).json(new ApiResponse(200, "Upload completed", result));
});

const cancelUpload = asyncHandler(async (req, res) => {
  const { uploadId } = req.params;
  const result = await chunkService.cancelUpload(uploadId, req.user._id);
  return res.status(200).json(new ApiResponse(200, "Upload cancelled", result));
});

export { initUpload, uploadChunk, getUploadStatus, completeUpload, cancelUpload };
