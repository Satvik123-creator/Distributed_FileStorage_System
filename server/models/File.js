import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    storedName: {
      type: String,
      required: true,
      trim: true,
    },
    nodeLocation: {
      type: String,
      required: true,
      trim: true,
    },
    primaryNode: {
      type: String,
      required: false,
      trim: true,
      index: true,
    },
    replicaNode: {
      type: String,
      required: false,
      trim: true,
      index: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    version: {
      type: Number,
      default: 1,
    },
    parentFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      default: null,
    },
    fileGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    fileHash: {
      type: String,
      default: null,
      index: true,
    },
    referenceCount: {
      type: Number,
      default: 1,
      min: 0,
    },
    isDedupReference: {
      type: Boolean,
      default: false,
    },
    dedupSourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      default: null,
    },
  },
  {
    versionKey: false,
    timestamps: false,
  },
);

fileSchema.index({ ownerId: 1 });
fileSchema.index({ originalName: 1 });
fileSchema.index({ uploadedAt: -1 });
fileSchema.index({ mimeType: 1 });

const File = mongoose.model("File", fileSchema);

export default File;
