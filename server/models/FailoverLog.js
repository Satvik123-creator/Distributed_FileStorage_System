import mongoose from "mongoose";

const failoverLogSchema = new mongoose.Schema(
  {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      required: true,
    },
    originalPrimary: {
      type: String,
      required: true,
    },
    newPrimary: {
      type: String,
      required: true,
    },
    originalReplica: {
      type: String,
      default: null,
    },
    newReplica: {
      type: String,
      default: null,
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    success: {
      type: Boolean,
      default: true,
    },
  },
  { versionKey: false },
);

failoverLogSchema.index({ timestamp: -1 });
failoverLogSchema.index({ fileId: 1 });

const FailoverLog = mongoose.model("FailoverLog", failoverLogSchema);

export default FailoverLog;
