import mongoose from "mongoose";
import crypto from "crypto";
import SharedFile from "../models/SharedFile.js";
import File from "../models/File.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

const INVITE_TOKEN_BYTES = 32;
const DEFAULT_EXPIRY_DAYS = 7;

const createShare = async ({ fileId, ownerId, targetEmail, permissions }) => {
  const file = await File.findById(fileId);
  if (!file || file.isDeleted) {
    throw new ApiError(404, "File not found");
  }
  if (file.ownerId.toString() !== ownerId.toString()) {
    throw new ApiError(403, "Only the file owner can share this file");
  }

  const targetUser = await User.findOne({ email: targetEmail });
  if (targetUser && targetUser._id.toString() === ownerId.toString()) {
    throw new ApiError(400, "Cannot share a file with yourself");
  }

  if (targetUser) {
    const existing = await SharedFile.findOne({
      fileId,
      ownerId,
      sharedWithUserId: targetUser._id,
    });
    if (existing) {
      throw new ApiError(409, "File already shared with this user");
    }
  }

  const token = crypto.randomBytes(INVITE_TOKEN_BYTES).toString("hex");
  const expiresAt = new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const share = await SharedFile.create({
    fileId,
    ownerId,
    email: targetEmail,
    sharedWithUserId: targetUser ? targetUser._id : null,
    permissions,
    token,
    expiresAt,
    status: targetUser ? "accepted" : "pending",
    acceptedAt: targetUser ? new Date() : null,
  });

  // Email invitation stub — integrate with SendGrid / SES / nodemailer here
  if (!targetUser) {
    sendInviteEmail({ to: targetEmail, token, file, ownerName: ownerId })
      .catch((err) => console.error("Failed to send invite email:", err.message));
  } else {
    sendShareNotification({ to: targetEmail, file, ownerName: ownerId })
      .catch((err) => console.error("Failed to send share notification:", err.message));
  }

  return share;
};

const getSharedWithMe = async (userId) => {
  const shares = await SharedFile.find({
    sharedWithUserId: userId,
    status: "accepted",
  })
    .populate("fileId")
    .populate("ownerId", "name email")
    .sort({ createdAt: -1 });

  const result = shares
    .filter((s) => s.fileId && !s.fileId.isDeleted)
    .map((s) => ({
      shareId: s._id,
      fileId: s.fileId._id,
      originalName: s.fileId.originalName,
      fileSize: s.fileId.fileSize,
      mimeType: s.fileId.mimeType,
      uploadedAt: s.fileId.uploadedAt,
      version: s.fileId.version,
      permissions: s.permissions,
      sharedBy: s.ownerId
        ? { name: s.ownerId.name, email: s.ownerId.email }
        : null,
      sharedAt: s.createdAt,
    }));

  return result;
};

const getSharesByFile = async (fileId, ownerId) => {
  const file = await File.findById(fileId);
  if (!file || file.isDeleted) {
    throw new ApiError(404, "File not found");
  }
  if (file.ownerId.toString() !== ownerId.toString()) {
    throw new ApiError(403, "Access denied");
  }

  const shares = await SharedFile.find({ fileId, ownerId })
    .populate("sharedWithUserId", "name email")
    .sort({ createdAt: -1 });

  return shares.map((s) => ({
    shareId: s._id,
    fileId: s.fileId,
    sharedWith: s.sharedWithUserId
      ? { id: s.sharedWithUserId._id, name: s.sharedWithUserId.name, email: s.sharedWithUserId.email }
      : null,
    email: s.email,
    permissions: s.permissions,
    status: s.status,
    createdAt: s.createdAt,
  }));
};

const removeShare = async (shareId, ownerId) => {
  const share = await SharedFile.findById(shareId);
  if (!share) {
    throw new ApiError(404, "Share not found");
  }
  if (share.ownerId.toString() !== ownerId.toString()) {
    throw new ApiError(403, "Only the file owner can remove sharing");
  }

  await SharedFile.findByIdAndDelete(shareId);
  return share;
};

const getUserSharePermissions = async (fileId, userId) => {
  const share = await SharedFile.findOne({
    fileId,
    sharedWithUserId: userId,
    status: "accepted",
  });

  if (!share) {
    return null;
  }

  return { permissions: share.permissions, shareId: share._id };
};

const checkShareAccess = async (fileId, userId, requiredPermission) => {
  const file = await File.findById(fileId);
  if (!file || file.isDeleted) {
    return false;
  }

  // Owner always has full access
  if (file.ownerId.toString() === userId.toString()) {
    return true;
  }

  const share = await SharedFile.findOne({
    fileId,
    sharedWithUserId: userId,
    status: "accepted",
  });

  if (!share) {
    return false;
  }

  if (requiredPermission && !share.permissions.includes(requiredPermission)) {
    return false;
  }

  return true;
};

const getSharedByMe = async (ownerId) => {
  const shares = await SharedFile.find({ ownerId })
    .populate("fileId")
    .populate("sharedWithUserId", "name email")
    .sort({ createdAt: -1 });

  const result = shares
    .filter((s) => s.fileId && !s.fileId.isDeleted)
    .map((s) => ({
      shareId: s._id,
      fileId: s.fileId._id,
      originalName: s.fileId.originalName,
      fileSize: s.fileId.fileSize,
      mimeType: s.fileId.mimeType,
      permissions: s.permissions,
      status: s.status,
      sharedWith: s.sharedWithUserId
        ? { id: s.sharedWithUserId._id, name: s.sharedWithUserId.name, email: s.sharedWithUserId.email }
        : null,
      email: s.email,
      sharedAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));

  return result;
};

// --- Email stubs (pluggable architecture) ---

const sendInviteEmail = async ({ to, token, file, ownerName }) => {
  const inviteLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/accept-share?token=${token}`;
  console.log(`[share-email-stub] Invite sent to ${to}: "${file.originalName}" — ${inviteLink}`);
  // TODO: Integrate with nodemailer / SendGrid / SES
  // const msg = {
  //   to,
  //   subject: `${ownerName} shared a file with you`,
  //   html: `<p>${ownerName} shared <strong>${file.originalName}</strong> with you.</p>
  //          <p><a href="${inviteLink}">Accept invitation</a></p>`,
  // };
  // await transporter.sendMail(msg);
};

const sendShareNotification = async ({ to, file, ownerName }) => {
  console.log(`[share-email-stub] Notification sent to ${to}: "${file.originalName}" shared by ${ownerName}`);
  // TODO: Integrate with nodemailer / SendGrid / SES
};

export {
  createShare,
  getSharedWithMe,
  getSharesByFile,
  removeShare,
  getUserSharePermissions,
  checkShareAccess,
  getSharedByMe,
  sendInviteEmail,
  sendShareNotification,
};
