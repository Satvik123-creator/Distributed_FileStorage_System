import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as activityService from "../services/activityService.js";

const getMyHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const logs = await activityService.getUserActivities(userId);

  const mapped = logs.map((l) => ({
    action: l.action,
    fileName: l.fileName || null,
    timestamp: l.timestamp,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, "Activity fetched successfully", { logs: mapped }));
});

export { getMyHistory };
