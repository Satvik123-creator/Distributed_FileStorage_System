import * as activityService from "../services/activityService.js";

const logAction = async (userId, action, opts = {}) => {
  const { fileId = null, fileName = null } = opts;
  try {
    await activityService.createActivity({
      userId,
      action,
      fileId,
      fileName,
    });
  } catch (err) {
    // Logging failures should not block main flows; swallow after console warn
    console.warn("Failed to write activity log", err);
  }
};

export { logAction };
