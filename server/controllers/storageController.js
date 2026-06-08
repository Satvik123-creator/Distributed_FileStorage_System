import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import * as fileService from "../services/fileService.js";
import * as replicationService from "../services/replicationService.js";
import { getAllNodeStats, updateNodeStats } from "../services/loadBalancerService.js";
import { getFailoverLogs, getFailoverStats } from "../services/failoverService.js";

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

const getStorageStats = asyncHandler(async (req, res) => {
  const stats = await getAllNodeStats();
  return res.status(200).json(new ApiResponse(200, "Storage stats", stats));
});

const repairFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  const file = await fileService.getFileById(fileId);

  if (!file) {
    throw new ApiError(404, "File metadata not found");
  }

  const result = await replicationService.repairMissingReplica({ fileMeta: file });

  await updateNodeStats(file.primaryNode);
  await updateNodeStats(file.replicaNode);

  return res.status(200).json(new ApiResponse(200, "Repair result", result));
});

const getFailoverLogsHandler = asyncHandler(async (req, res) => {
  const { limit, skip } = req.query;
  const logs = await getFailoverLogs({
    limit: parseInt(limit, 10) || 50,
    skip: parseInt(skip, 10) || 0,
  });
  return res.status(200).json(new ApiResponse(200, "Failover logs", logs));
});

const getFailoverStatsHandler = asyncHandler(async (req, res) => {
  const stats = await getFailoverStats();
  return res.status(200).json(new ApiResponse(200, "Failover stats", stats));
});

import { getDedupStats } from "../services/dedupService.js";
import { getEncryptionStatus } from "../services/encryptionService.js";
import StorageGrowth from "../models/StorageGrowth.js";

const getDedupStatsHandler = asyncHandler(async (req, res) => {
  const stats = await getDedupStats(req.user._id);
  return res.status(200).json(new ApiResponse(200, "Dedup stats", stats));
});

const getEncryptionStatusHandler = asyncHandler(async (req, res) => {
  const status = await getEncryptionStatus(req.user._id);
  return res.status(200).json(new ApiResponse(200, "Encryption status", status));
});

const getGrowthData = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  let records = await StorageGrowth.find({ date: { $gte: since } })
    .sort({ date: 1 })
    .lean();

  if (records.length === 0) {
    const nodeStats = await getAllNodeStats();
    const snapshots = [];
    for (const [nodeName, stats] of Object.entries(nodeStats)) {
      snapshots.push({
        nodeName,
        date: new Date(),
        totalFiles: stats.totalFiles,
        storageUsed: stats.storageUsed,
      });
    }
    await StorageGrowth.insertMany(snapshots);
    records = snapshots;
  }

  return res.status(200).json(new ApiResponse(200, "Growth data", records));
});

const recordSnapshot = asyncHandler(async (req, res) => {
  const nodeStats = await getAllNodeStats();
  const snapshots = [];
  for (const [nodeName, stats] of Object.entries(nodeStats)) {
    snapshots.push({
      nodeName,
      date: new Date(),
      totalFiles: stats.totalFiles,
      storageUsed: stats.storageUsed,
    });
  }
  await StorageGrowth.insertMany(snapshots);
  return res.status(200).json(new ApiResponse(200, "Snapshot recorded", snapshots));
});

export { healthCheck, getStorageStats, repairFile, getFailoverLogsHandler, getFailoverStatsHandler, getDedupStatsHandler, getEncryptionStatusHandler, getGrowthData, recordSnapshot };
