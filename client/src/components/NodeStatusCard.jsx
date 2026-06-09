import React from "react";

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const statusMeta = {
  healthy: { label: "Healthy", icon: "●" },
  warning: { label: "Warning", icon: "●" },
  offline: { label: "Offline", icon: "●" },
  unknown: { label: "Unknown", icon: "●" },
};

const statusColors = (status) => {
  const s = String(status || "unknown").toLowerCase();
  if (s === "healthy") return "bg-emerald-900/30 text-emerald-400";
  if (s === "warning") return "bg-amber-900/30 text-amber-400";
  if (s === "offline") return "bg-red-900/30 text-red-400";
  return "bg-gray-800 text-gray-400";
};

const NodeStatusCard = ({
  nodeName,
  status,
  lastChecked,
  storedFilesCount,
  storageUsed,
  onClick,
  selected,
}) => {
  const normalizedStatus = String(status || "unknown").toLowerCase();
  const meta = statusMeta[normalizedStatus] || statusMeta.unknown;

  return (
    <button
      type="button"
      className={`flex flex-col gap-4 p-5 border border-gray-800 rounded-xl bg-gray-900 shadow-sm cursor-pointer text-left transition-all hover:border-gray-600 ${selected ? "border-gray-600 ring-2 ring-gray-700/50" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Storage Node</p>
        <h3 className="text-lg font-bold text-gray-100 capitalize">{nodeName}</h3>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${statusColors(status)}`}>
          {meta.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-400">Current Status</span>
          <strong className="text-gray-100">{meta.label}</strong>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-400">Last Checked</span>
          <strong className="text-gray-100">{lastChecked}</strong>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-400">Stored Files</span>
          <strong className="text-gray-100">{storedFilesCount ?? "N/A"}</strong>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-400">Storage Used</span>
          <strong className="text-gray-100">{storageUsed != null ? formatBytes(storageUsed) : "N/A"}</strong>
        </div>
      </div>
    </button>
  );
};

export default NodeStatusCard;
