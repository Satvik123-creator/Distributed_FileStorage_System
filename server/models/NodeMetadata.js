import mongoose from "mongoose";

const nodeMetadataSchema = new mongoose.Schema(
  {
    nodeName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    totalFiles: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalStorageUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false },
);

const NodeMetadata = mongoose.model("NodeMetadata", nodeMetadataSchema);

export default NodeMetadata;
