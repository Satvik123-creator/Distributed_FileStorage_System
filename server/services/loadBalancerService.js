import NodeMetadata from "../models/NodeMetadata.js";
import File from "../models/File.js";

const NODES = ["node1", "node2", "node3"];

const getAllNodeStats = async () => {
  const stats = {};
  for (const nodeName of NODES) {
    let meta = await NodeMetadata.findOne({ nodeName });
    if (!meta) {
      meta = await NodeMetadata.create({
        nodeName,
        totalFiles: 0,
        totalStorageUsed: 0,
        lastUpdated: new Date(),
      });
    }
    stats[nodeName] = {
      totalFiles: meta.totalFiles,
      storageUsed: meta.totalStorageUsed,
      lastUpdated: meta.lastUpdated,
    };
  }
  return stats;
};

const selectLeastLoadedNode = async () => {
  const stats = await getAllNodeStats();
  let selectedNode = NODES[0];
  let minUsage = stats[NODES[0]].storageUsed;

  for (const nodeName of NODES) {
    if (stats[nodeName].storageUsed < minUsage) {
      minUsage = stats[nodeName].storageUsed;
      selectedNode = nodeName;
    }
  }

  return selectedNode;
};

const updateNodeStats = async (nodeName) => {
  const files = await File.find({ nodeLocation: nodeName, isDeleted: false });
  const totalFiles = files.length;
  const totalStorageUsed = files.reduce(
    (sum, f) => sum + (Number(f.fileSize) || 0),
    0,
  );

  await NodeMetadata.findOneAndUpdate(
    { nodeName },
    {
      totalFiles,
      totalStorageUsed,
      lastUpdated: new Date(),
    },
    { upsert: true, returnDocument: "after" },
  );
};

const initNodeMetadata = async () => {
  for (const nodeName of NODES) {
    const existing = await NodeMetadata.findOne({ nodeName });
    if (!existing) {
      await updateNodeStats(nodeName);
    }
  }
};

export { getAllNodeStats, selectLeastLoadedNode, updateNodeStats, initNodeMetadata };
