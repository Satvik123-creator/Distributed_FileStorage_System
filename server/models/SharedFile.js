import mongoose from "mongoose";

const sharedFileSchema = new mongoose.Schema(
  {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sharedWithUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    permissions: {
      type: [String],
      enum: ["view", "download", "edit"],
      default: ["view"],
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    token: {
      type: String,
      unique: true,
      sparse: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

sharedFileSchema.index({ ownerId: 1 });
sharedFileSchema.index({ sharedWithUserId: 1 });
sharedFileSchema.index({ fileId: 1 });

const SharedFile = mongoose.model("SharedFile", sharedFileSchema);

export default SharedFile;
