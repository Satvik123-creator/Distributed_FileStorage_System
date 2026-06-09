import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../routes/appRoutes.js";
import { Layers, ArrowRight } from "lucide-react";

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const DedupAnalyticsWidget = React.memo(({ dedupStats }) => {
  const navigate = useNavigate();
  const { totalLogicalFiles = 0, totalPhysicalFiles = 0, logicalBytes = 0, physicalBytes = 0, savingsBytes = 0, savingsPercent = 0 } = dedupStats || {};
  const duplicatesPrevented = Math.max(0, totalLogicalFiles - totalPhysicalFiles);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.25, ease: "easeOut" }}
      className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
            <Layers className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100">Deduplication</h3>
            <p className="text-xs text-gray-500">Storage savings</p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-100 transition-colors cursor-pointer"
          onClick={() => navigate(APP_PATHS.storageAnalytics)}
        >
          Details
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-col gap-2.5 mb-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Storage Saved</span>
          <span className="text-xs text-gray-500">({savingsPercent}%)</span>
        </div>
        <strong className="text-xl font-semibold text-gray-100">{formatBytes(savingsBytes)}</strong>
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(savingsPercent, 100)}%` }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="h-full rounded-full bg-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-gray-800 border border-gray-700">
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Total Uploads</span>
          <strong className="text-sm font-semibold text-gray-100">{totalLogicalFiles}</strong>
        </div>
        <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-gray-800 border border-gray-700">
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Stored</span>
          <strong className="text-sm font-semibold text-gray-100">{totalPhysicalFiles}</strong>
        </div>
        <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-gray-800 border border-gray-700">
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Dup Prevented</span>
          <strong className="text-sm font-semibold text-gray-100">{duplicatesPrevented}</strong>
        </div>
      </div>
    </motion.section>
  );
});

export default DedupAnalyticsWidget;
