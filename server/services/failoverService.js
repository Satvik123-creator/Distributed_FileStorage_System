import FailoverLog from "../models/FailoverLog.js";
import File from "../models/File.js";
import { getFilePath, storeFile, createUserFolderIfNotExists } from "./storageService.js";
import { getReplicaNode } from "./replicationService.js";
import { updateNodeStats } from "./loadBalancerService.js";
import * as activityService from "./activityService.js";
import fs from "fs/promises";

const performFailover = async ({ file, userId }) => {
  const { primaryNode, replicaNode, ownerId, storedName, originalName, _id } = file;
  const userIdStr = ownerId.toString();

  const primaryPath = getFilePath(primaryNode, userIdStr, storedName);
  const replicaPath = getFilePath(replicaNode, userIdStr, storedName);

  const primaryExists = await fs.access(primaryPath).then(() => true).catch(() => false);
  const replicaExists = await fs.access(replicaPath).then(() => true).catch(() => false);

  if (primaryExists) {
    return { failovered: false, reason: "Primary is healthy" };
  }

  if (!replicaExists) {
    return { failovered: false, reason: "Replica also missing" };
  }

  // Promote replica to new primary
  const newPrimary = replicaNode;
  const newReplica = getReplicaNode(newPrimary);

  // Prevent selecting same node as both primary and replica
  const effectiveNewReplica = newReplica === newPrimary ? getReplicaNode(newReplica) : newReplica;

  // Copy replica content to the new replica node
  await createUserFolderIfNotExists(effectiveNewReplica, userIdStr);
  const newReplicaPath = getFilePath(effectiveNewReplica, userIdStr, storedName);
  await fs.copyFile(replicaPath, newReplicaPath);

  // Update metadata
  file.primaryNode = newPrimary;
  file.replicaNode = effectiveNewReplica;
  file.nodeLocation = newPrimary;
  await file.save();

  // Log failover
  await FailoverLog.create({
    fileId: _id,
    originalPrimary: primaryNode,
    newPrimary,
    originalReplica: replicaNode,
    newReplica: effectiveNewReplica,
    triggeredBy: userId,
    timestamp: new Date(),
    success: true,
  });

  // Log activity
  await activityService.createActivity({
    userId,
    action: "RECOVERY",
    fileId: _id,
    fileName: originalName,
  });

  // Update node stats
  await updateNodeStats(newPrimary);
  await updateNodeStats(effectiveNewReplica);

  return {
    failovered: true,
    newPrimary,
    newReplica: effectiveNewReplica,
  };
};

const getFailoverLogs = async ({ limit = 50, skip = 0 } = {}) => {
  const logs = await FailoverLog.find()
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .populate("fileId", "originalName")
    .populate("triggeredBy", "name email");

  return logs;
};

const getFailoverStats = async () => {
  const totalFailovers = await FailoverLog.countDocuments();
  const lastFailover = await FailoverLog.findOne().sort({ timestamp: -1 });

  return {
    totalFailovers,
    lastFailoverTime: lastFailover ? lastFailover.timestamp : null,
    lastFailover: lastFailover || null,
  };
};

export { performFailover, getFailoverLogs, getFailoverStats };
