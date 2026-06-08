import React from "react";

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const StorageQuotaProfile = React.memo(({ usedBytes, limitBytes, percent, remainingBytes, alerts }) => {
  const barLevel = percent >= 100 ? "critical" : percent >= 90 ? "warning" : percent >= 80 ? "info" : "normal";

  return (
    <div className="storage-quota-profile">
      <div className="panel-header">
        <div>
          <p className="section-label">Storage Quota</p>
          <h3>Usage details</h3>
        </div>
        <span>{percent}% used</span>
      </div>

      <div className="quota-metrics-grid">
        <div className="quota-metric">
          <span>Storage Used</span>
          <strong>{formatBytes(usedBytes)}</strong>
        </div>
        <div className="quota-metric">
          <span>Storage Remaining</span>
          <strong>{formatBytes(remainingBytes)}</strong>
        </div>
        <div className="quota-metric">
          <span>Storage Limit</span>
          <strong>{formatBytes(limitBytes)}</strong>
        </div>
      </div>

      <div className="quota-progress-section">
        <div className="quota-progress-header">
          <span>Used</span>
          <strong>{percent}%</strong>
        </div>
        <div className="quota-bar-track">
          <div
            className={`quota-bar-fill quota-bar-fill-${barLevel}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>

      {alerts && alerts.length > 0 && (
        <div className="quota-alerts">
          {alerts.map((alert, i) => (
            <div key={i} className={`quota-alert quota-alert-${alert.level}`}>
              {alert.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default StorageQuotaProfile;
