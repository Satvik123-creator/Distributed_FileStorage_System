import React from "react";

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const StorageUsageMeter = React.memo(({ usedBytes, limitBytes, percent }) => {
  const barLevel = percent >= 100 ? "critical" : percent >= 90 ? "warning" : percent >= 80 ? "info" : "normal";

  return (
    <section className="dashboard-panel storage-usage-meter-panel">
      <div className="panel-header">
        <div>
          <p className="section-label">Storage Usage</p>
          <h3>Quota meter</h3>
        </div>
        <span>{percent}%</span>
      </div>

      <div className="usage-meter-bar-section">
        <div className="quota-bar-track">
          <div
            className={`quota-bar-fill quota-bar-fill-${barLevel}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>

      <div className="usage-meter-stats">
        <div className="um-stat">
          <span>Used</span>
          <strong>{formatBytes(usedBytes)}</strong>
        </div>
        <div className="um-stat">
          <span>Remaining</span>
          <strong>{formatBytes(Math.max(0, limitBytes - usedBytes))}</strong>
        </div>
        <div className="um-stat">
          <span>Limit</span>
          <strong>{formatBytes(limitBytes)}</strong>
        </div>
      </div>
    </section>
  );
});

export default StorageUsageMeter;
