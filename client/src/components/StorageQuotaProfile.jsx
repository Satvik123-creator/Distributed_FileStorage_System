import React from "react";

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const barFill = (level) => {
  if (level === "normal") return "bg-primary";
  if (level === "info") return "bg-amber-500";
  if (level === "warning") return "bg-orange-500";
  return "bg-red-500";
};

const alertStyles = (level) => {
  if (level === "info") return "bg-blue-50 text-blue-700 border border-blue-200";
  if (level === "warning") return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-gray-50 text-text border border-black/8";
};

const StorageQuotaProfile = React.memo(({ usedBytes, limitBytes, percent, remainingBytes, alerts }) => {
  const barLevel = percent >= 100 ? "critical" : percent >= 90 ? "warning" : percent >= 80 ? "info" : "normal";

  return (
    <div className="p-5.5 border border-black/8 rounded-2xl bg-white/90 shadow-card grid gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted">Storage Quota</p>
          <h3 className="text-lg font-bold text-text">Usage details</h3>
        </div>
        <span className="text-sm font-bold text-text">{percent}% used</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-[rgba(244,247,251,0.82)] border border-black/8">
          <span className="text-xs text-muted">Storage Used</span>
          <strong className="text-lg font-bold text-text">{formatBytes(usedBytes)}</strong>
        </div>
        <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-[rgba(244,247,251,0.82)] border border-black/8">
          <span className="text-xs text-muted">Storage Remaining</span>
          <strong className="text-lg font-bold text-text">{formatBytes(remainingBytes)}</strong>
        </div>
        <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-[rgba(244,247,251,0.82)] border border-black/8">
          <span className="text-xs text-muted">Storage Limit</span>
          <strong className="text-lg font-bold text-text">{formatBytes(limitBytes)}</strong>
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Used</span>
          <strong className="text-text">{percent}%</strong>
        </div>
        <div className="h-2.5 bg-black/8 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barFill(barLevel)}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>

      {alerts && alerts.length > 0 && (
        <div className="grid gap-2">
          {alerts.map((alert, i) => (
            <div key={i} className={`px-3 py-2 rounded-lg text-sm ${alertStyles(alert.level)}`}>
              {alert.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default StorageQuotaProfile;
