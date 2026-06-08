import mongoose from "mongoose";

const uploadSessionSchema = new mongoose.Schema(
  {
    uploadId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    totalChunks: {
      type: Number,
      required: true,
    },
    receivedChunks: {
      type: [Number],
      default: [],
    },
    chunkSize: {
      type: Number,
      required: true,
    },
    fileHash: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["initiated", "uploading", "completed", "failed"],
      default: "initiated",
    },
    storedName: {
      type: String,
      default: null,
    },
    primaryNode: {
      type: String,
      default: null,
    },
    replicaNode: {
      type: String,
      default: null,
    },
    tempDir: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

uploadSessionSchema.index({ userId: 1, status: 1 });

const UploadSession = mongoose.model("UploadSession", uploadSessionSchema);

export default UploadSession;
