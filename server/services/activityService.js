import ActivityLog from "../models/ActivityLog.js";

const createActivity = async ({
  userId,
  action,
  fileId = null,
  fileName = null,
}) => {
  const entry = await ActivityLog.create({
    userId,
    action,
    fileId,
    fileName,
    timestamp: new Date(),
  });

  return entry;
};

const getUserActivities = async (userId) => {
  const logs = await ActivityLog.find({ userId }).sort({ timestamp: -1 });
  return logs;
};

export { createActivity, getUserActivities };
