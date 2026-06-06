import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "LOGIN",
        "UPLOAD",
        "DOWNLOAD",
        "DELETE",
        "SEARCH",
        "REPLICATION",
        "RECOVERY",
        "REPAIR",
      ],
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      required: false,
    },
    fileName: {
      type: String,
      required: false,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    versionKey: false,
  },
);

activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ timestamp: -1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

export default ActivityLog;
