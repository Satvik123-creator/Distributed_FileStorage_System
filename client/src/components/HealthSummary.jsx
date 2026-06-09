import React from "react";

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const HealthSummary = ({
  totalNodes,
  healthyNodes,
  offlineNodes,
  availability,
  totalFiles,
  totalStorageUsed,
  lastUpdated,
}) => {
  return (
    <div className="p-5 rounded-xl border border-gray-800 bg-gray-900 shadow-sm grid gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">System Health</p>
        <h3 className="text-lg font-bold text-gray-100">Storage Overview</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1 p-3 rounded-xl bg-gray-800 border border-gray-700">
          <span className="text-xs text-gray-400">Total Nodes</span>
          <strong className="text-lg text-gray-100">{totalNodes}</strong>
        </div>
        <div className="flex flex-col gap-1 p-3 rounded-xl bg-gray-800 border border-gray-700">
          <span className="text-xs text-gray-400">Healthy Nodes</span>
          <strong className="text-lg text-emerald-400">{healthyNodes}</strong>
        </div>
        <div className="flex flex-col gap-1 p-3 rounded-xl bg-gray-800 border border-gray-700">
          <span className="text-xs text-gray-400">Offline Nodes</span>
          <strong className={`text-lg ${offlineNodes > 0 ? "text-red-400" : "text-gray-100"}`}>{offlineNodes}</strong>
        </div>
        <div className="flex flex-col gap-1 p-3 rounded-xl bg-gray-800 border border-gray-700">
          <span className="text-xs text-gray-400">Availability</span>
          <strong className="text-lg text-gray-100">{availability}%</strong>
        </div>
        <div className="flex flex-col gap-1 p-3 rounded-xl bg-gray-800 border border-gray-700">
          <span className="text-xs text-gray-400">Total Files</span>
          <strong className="text-lg text-gray-100">{totalFiles ?? "N/A"}</strong>
        </div>
        <div className="flex flex-col gap-1 p-3 rounded-xl bg-gray-800 border border-gray-700">
          <span className="text-xs text-gray-400">Total Storage</span>
          <strong className="text-lg text-gray-100">{totalStorageUsed != null ? formatBytes(totalStorageUsed) : "N/A"}</strong>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-800 text-sm">
        <span className="text-gray-400">Last Updated</span>
        <strong className="text-gray-100">{lastUpdated}</strong>
      </div>
    </div>
  );
};

export default HealthSummary;
