import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import * as fileService from "../services/fileService.js";
import * as replicationService from "../services/replicationService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageRoot = path.resolve(__dirname, "..", "storage");

const nodes = ["node1", "node2", "node3"];

const healthCheck = asyncHandler(async (req, res) => {
  const status = {};
  for (const node of nodes) {
    const nodePath = path.join(storageRoot, node);
    try {
      await fs.access(nodePath);
      status[node] = "healthy";
    } catch (err) {
      status[node] = "offline";
    }
  }

  return res.status(200).json(new ApiResponse(200, "Storage health", status));
});

const repairFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  const file = await fileService.getFileById(fileId);

  if (!file) {
    throw new ApiError(404, "File metadata not found");
  }

  const result = await replicationService.repairMissingReplica({ fileMeta: file });

  return res.status(200).json(new ApiResponse(200, "Repair result", result));
});

export { healthCheck, repairFile };
