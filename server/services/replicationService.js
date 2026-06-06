import { getFilePath, storeFile, createUserFolderIfNotExists } from "./storageService.js";
import fs from "fs/promises";
import ApiError from "../utils/ApiError.js";
import chooseNode from "../utils/chooseNode.js";
import * as activityService from "./activityService.js";

const getReplicaNode = (primary) => {
  const nodes = ["node1", "node2", "node3"];
  const idx = nodes.indexOf(primary);
  if (idx === -1) return nodes[0];
  return nodes[(idx + 1) % nodes.length];
};

const createReplica = async ({ buffer, primaryNode, userId, storedName, originalName }) => {
  const replicaNode = getReplicaNode(primaryNode);

  try {
    await createUserFolderIfNotExists(replicaNode, userId);
    const replicaPath = await storeFile({ buffer, nodeLocation: replicaNode, userId, storedName });
    // log replication
    await activityService.createActivity({ userId, action: "REPLICATION", fileId: null, fileName: originalName });
    return { replicaNode, replicaPath };
  } catch (err) {
    throw new ApiError(500, "Failed to create replica");
  }
};

const recoverFromReplica = async ({ fileMeta }) => {
  // Attempt to recover missing primary from replica or vice versa
  const { primaryNode, replicaNode, ownerId, storedName, originalName } = fileMeta;
  const primaryPath = getFilePath(primaryNode, ownerId.toString(), storedName);
  const replicaPath = getFilePath(replicaNode, ownerId.toString(), storedName);

  try {
    // If primary missing but replica exists, copy replica -> primary
    await fs.access(primaryPath).catch(async () => {
      await fs.access(replicaPath);
      await createUserFolderIfNotExists(primaryNode, ownerId.toString());
      await fs.copyFile(replicaPath, primaryPath);
      await activityService.createActivity({ userId: ownerId, action: "RECOVERY", fileId: fileMeta._id, fileName: originalName });
      return { recovered: "primary" };
    });

    // If replica missing but primary exists, copy primary -> replica
    await fs.access(replicaPath).catch(async () => {
      await fs.access(primaryPath);
      await createUserFolderIfNotExists(replicaNode, ownerId.toString());
      await fs.copyFile(primaryPath, replicaPath);
      await activityService.createActivity({ userId: ownerId, action: "RECOVERY", fileId: fileMeta._id, fileName: originalName });
      return { recovered: "replica" };
    });

    return { recovered: "none" };
  } catch (err) {
    throw new ApiError(500, "Recovery failed: " + err.message);
  }
};

const repairMissingReplica = async ({ fileMeta }) => {
  // Ensure both primary and replica exist; create missing copy from the other
  const { primaryNode, replicaNode, ownerId, storedName, originalName } = fileMeta;
  const primaryPath = getFilePath(primaryNode, ownerId.toString(), storedName);
  const replicaPath = getFilePath(replicaNode, ownerId.toString(), storedName);

  try {
    const primaryExists = await fs.access(primaryPath).then(() => true).catch(() => false);
    const replicaExists = await fs.access(replicaPath).then(() => true).catch(() => false);

    if (primaryExists && !replicaExists) {
      await createUserFolderIfNotExists(replicaNode, ownerId.toString());
      await fs.copyFile(primaryPath, replicaPath);
      await activityService.createActivity({ userId: ownerId, action: "REPAIR", fileId: fileMeta._id, fileName: originalName });
      return { repaired: "replica" };
    }

    if (!primaryExists && replicaExists) {
      await createUserFolderIfNotExists(primaryNode, ownerId.toString());
      await fs.copyFile(replicaPath, primaryPath);
      await activityService.createActivity({ userId: ownerId, action: "REPAIR", fileId: fileMeta._id, fileName: originalName });
      return { repaired: "primary" };
    }

    return { repaired: "none" };
  } catch (err) {
    throw new ApiError(500, "Repair failed: " + err.message);
  }
};

export { createReplica, getReplicaNode, recoverFromReplica, repairMissingReplica };
