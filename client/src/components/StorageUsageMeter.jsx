import React from "react";
import { motion } from "framer-motion";
import { HardDrive } from "lucide-react";

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const StorageUsageMeter = React.memo(({ usedBytes, limitBytes, percent }) => {
  const remaining = Math.max(0, limitBytes - usedBytes);
  const barColor = percent >= 90 ? "bg-red-500" : percent >= 75 ? "bg-amber-500" : "bg-blue-600";

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
      className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
          <HardDrive className="w-4 h-4 text-gray-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-100">Storage Usage</h3>
          <p className="text-xs text-gray-500">Quota utilization</p>
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-semibold text-gray-100">{formatBytes(usedBytes)}</span>
        <span className="text-sm text-gray-500">/ {formatBytes(limitBytes)}</span>
        <span className="ml-auto text-sm font-medium text-gray-400">{percent}%</span>
      </div>

      <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percent, 100)}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className={`h-full rounded-full ${barColor} transition-colors`}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Used", value: formatBytes(usedBytes) },
          { label: "Remaining", value: formatBytes(remaining) },
          { label: "Limit", value: formatBytes(limitBytes) },
        ].map((item) => (
          <div key={item.label} className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{item.label}</span>
            <span className="text-sm font-semibold text-gray-100">{item.value}</span>
          </div>
        ))}
      </div>
    </motion.section>
  );
});

export default StorageUsageMeter;
