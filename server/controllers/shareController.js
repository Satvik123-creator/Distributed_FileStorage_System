import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as shareService from "../services/shareService.js";

const shareFile = asyncHandler(async (req, res) => {
  const { fileId, email, permissions } = req.body;

  if (!fileId || !email) {
    return res.status(400).json(new ApiResponse(400, "fileId and email are required"));
  }

  const share = await shareService.createShare({
    fileId,
    ownerId: req.user._id,
    targetEmail: email,
    permissions: permissions || ["view"],
  });

  return res.status(201).json(new ApiResponse(201, "File shared successfully", { share }));
});

const getSharedWithMe = asyncHandler(async (req, res) => {
  const files = await shareService.getSharedWithMe(req.user._id);
  return res.status(200).json(new ApiResponse(200, "Shared files fetched", { files }));
});

const getSharedByMe = asyncHandler(async (req, res) => {
  const shares = await shareService.getSharedByMe(req.user._id);
  return res.status(200).json(new ApiResponse(200, "Shares fetched", { shares }));
});

const removeShare = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await shareService.removeShare(id, req.user._id);
  return res.status(200).json(new ApiResponse(200, "Share removed successfully"));
});

const getFileShares = asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  const shares = await shareService.getSharesByFile(fileId, req.user._id);
  return res.status(200).json(new ApiResponse(200, "File shares fetched", { shares }));
});

export { shareFile, getSharedWithMe, getSharedByMe, removeShare, getFileShares };
