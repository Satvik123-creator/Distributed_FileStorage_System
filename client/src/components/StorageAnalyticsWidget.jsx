import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../routes/appRoutes.js";
import { BarChart3, ArrowRight } from "lucide-react";

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const StorageAnalyticsWidget = React.memo(({ nodes }) => {
  const navigate = useNavigate();
  const totalStorage = nodes.reduce((s, n) => s + (Number(n.storageUsed) || 0), 0);
  const totalFiles = nodes.reduce((s, n) => s + (Number(n.storedFilesCount) || 0), 0);
  const healthyCount = nodes.filter((n) => n.status === "healthy").length;

  const maxStorage = Math.max(...nodes.map((n) => n.storageUsed), 1);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
      className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100">Storage Analytics</h3>
            <p className="text-xs text-gray-500">Cluster summary</p>
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

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="flex flex-col gap-1 p-3 rounded-lg bg-gray-800 border border-gray-700">
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Total Storage</span>
          <strong className="text-lg font-semibold text-gray-100">{formatBytes(totalStorage)}</strong>
        </div>
        <div className="flex flex-col gap-1 p-3 rounded-lg bg-gray-800 border border-gray-700">
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Total Files</span>
          <strong className="text-lg font-semibold text-gray-100">{totalFiles}</strong>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Node utilization</span>
          <span>{healthyCount}/{nodes.length} healthy</span>
        </div>
        {nodes.map((node) => {
          const pct = maxStorage > 0 ? Math.round((node.storageUsed / maxStorage) * 100) : 0;
          const statusColor = node.status === "healthy" ? "bg-emerald-500" : node.status === "offline" ? "bg-red-500" : "bg-amber-500";
          return (
            <div key={node.nodeName} className="flex items-center gap-2.5">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusColor}`} />
              <span className="text-xs text-gray-400 capitalize w-14">{node.nodeName}</span>
              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gray-400 transition-all" style={{ width: `${Math.max(pct, 2)}%` }} />
              </div>
              <span className="text-xs text-gray-500 w-12 text-right">{formatBytes(node.storageUsed)}</span>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
});

export default StorageAnalyticsWidget;
