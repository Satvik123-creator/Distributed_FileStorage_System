import crypto from "crypto";
import File from "../models/File.js";

const calculateHash = (buffer) => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

const findExistingByHash = async (hash) => {
  if (!hash) return null;

  return File.findOne({
    fileHash: hash,
    isDedupReference: false,
    isDeleted: false,
  });
};

const createDedupReference = async ({ sourceFile, ownerId, originalName, mimeType, version, parentFileId, fileGroupId }) => {
  await File.findByIdAndUpdate(sourceFile._id, { $inc: { referenceCount: 1 } });

  const refFile = await File.create({
    ownerId,
    originalName,
    storedName: sourceFile.storedName,
    nodeLocation: sourceFile.nodeLocation,
    primaryNode: sourceFile.primaryNode,
    replicaNode: sourceFile.replicaNode,
    fileSize: sourceFile.fileSize,
    mimeType,
    uploadedAt: new Date(),
    fileHash: sourceFile.fileHash,
    referenceCount: 0,
    isDedupReference: true,
    dedupSourceId: sourceFile._id,
    version: version || 1,
    parentFileId: parentFileId || null,
    fileGroupId: fileGroupId || null,
  });

  return refFile;
};

const decrementReference = async (file) => {
  let sourceFile = file;

  if (file.isDedupReference && file.dedupSourceId) {
    sourceFile = await File.findById(file.dedupSourceId);
    if (!sourceFile || sourceFile.isDeleted) {
      sourceFile = null;
    }
  }

  if (!sourceFile) {
    return { physicalDeleted: false };
  }

  const newCount = sourceFile.referenceCount - 1;

  if (newCount <= 0) {
    sourceFile.referenceCount = 0;
    sourceFile.isDeleted = true;
    sourceFile.deletedAt = new Date();
    await sourceFile.save();
    return { physicalDeleted: true, sourceFile };
  }

  sourceFile.referenceCount = newCount;
  await sourceFile.save();
  return { physicalDeleted: false, sourceFile };
};

const getDedupStats = async (userId) => {
  const match = userId ? { ownerId: userId, isDeleted: false } : { isDeleted: false };

  const allFiles = await File.find(match);
  const logicalBytes = allFiles.reduce((sum, f) => sum + (Number(f.fileSize) || 0), 0);

  const physicalFiles = allFiles.filter((f) => !f.isDedupReference);
  const physicalBytes = physicalFiles.reduce((sum, f) => sum + (Number(f.fileSize) || 0), 0);

  const savingsBytes = Math.max(0, logicalBytes - physicalBytes);
  const savingsPercent = logicalBytes > 0 ? Number(((savingsBytes / logicalBytes) * 100).toFixed(1)) : 0;

  return {
    totalLogicalFiles: allFiles.length,
    totalPhysicalFiles: physicalFiles.length,
    logicalBytes,
    physicalBytes,
    savingsBytes,
    savingsPercent,
  };
};

export { calculateHash, findExistingByHash, createDedupReference, decrementReference, getDedupStats };
