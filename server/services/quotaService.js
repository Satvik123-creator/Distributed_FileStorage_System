import User from "../models/User.js";
import File from "../models/File.js";
import ApiError from "../utils/ApiError.js";

const ONE_GB = 1073741824;

const checkQuota = async (userId, fileSize) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const newStorageUsed = user.storageUsed + fileSize;
  if (newStorageUsed > user.storageLimit) {
    const usedPercent = ((user.storageUsed / user.storageLimit) * 100).toFixed(1);
    throw new ApiError(
      413,
      `Storage quota exceeded. Used ${usedPercent}% of ${(user.storageLimit / ONE_GB).toFixed(1)} GB limit. ` +
      `File size ${(fileSize / ONE_GB).toFixed(2)} GB exceeds remaining space.`,
    );
  }

  return { allowed: true, remaining: user.storageLimit - newStorageUsed };
};

const updateStorageUsed = async (userId) => {
  const files = await File.find({ ownerId: userId, isDeleted: false });
  const totalUsed = files.reduce((sum, f) => sum + (Number(f.fileSize) || 0), 0);

  await User.findByIdAndUpdate(userId, { storageUsed: totalUsed }, { returnDocument: "after" });

  return totalUsed;
};

const getUserStorageInfo = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const usedBytes = user.storageUsed;
  const limitBytes = user.storageLimit;
  const percent = limitBytes > 0 ? Number(((usedBytes / limitBytes) * 100).toFixed(1)) : 0;

  const alerts = [];
  if (percent >= 100) alerts.push({ level: "critical", message: "Storage is full. Uploads are blocked." });
  else if (percent >= 90) alerts.push({ level: "warning", message: "You have used 90% of your storage." });
  else if (percent >= 80) alerts.push({ level: "info", message: "You have used 80% of your storage." });

  return {
    usedBytes,
    limitBytes,
    percent,
    remainingBytes: Math.max(0, limitBytes - usedBytes),
    alerts,
  };
};

const recalculateAndGetStorageInfo = async (userId) => {
  await updateStorageUsed(userId);
  return getUserStorageInfo(userId);
};

export { checkQuota, updateStorageUsed, getUserStorageInfo, recalculateAndGetStorageInfo };
