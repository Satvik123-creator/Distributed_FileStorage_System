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
    <div className="health-summary-card">
      <div>
        <p className="section-label">System Health</p>
        <h3>Storage Overview</h3>
      </div>

      <div className="health-summary-grid">
        <div>
          <span>Total Nodes</span>
          <strong>{totalNodes}</strong>
        </div>
        <div>
          <span>Healthy Nodes</span>
          <strong>{healthyNodes}</strong>
        </div>
        <div>
          <span>Offline Nodes</span>
          <strong>{offlineNodes}</strong>
        </div>
        <div>
          <span>Availability</span>
          <strong>{availability}%</strong>
        </div>
        <div>
          <span>Total Files</span>
          <strong>{totalFiles ?? "N/A"}</strong>
        </div>
        <div>
          <span>Total Storage</span>
          <strong>{totalStorageUsed != null ? formatBytes(totalStorageUsed) : "N/A"}</strong>
        </div>
      </div>

      <div className="health-summary-footer">
        <span>Last Updated</span>
        <strong>{lastUpdated}</strong>
      </div>
    </div>
  );
};

export default HealthSummary;
