import mongoose from "mongoose";

const storageGrowthSchema = new mongoose.Schema(
  {
    nodeName: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    totalFiles: { type: Number, default: 0, min: 0 },
    storageUsed: { type: Number, default: 0, min: 0 },
  },
  { versionKey: false },
);

storageGrowthSchema.index({ nodeName: 1, date: -1 });

const StorageGrowth = mongoose.model("StorageGrowth", storageGrowthSchema);
export default StorageGrowth;
