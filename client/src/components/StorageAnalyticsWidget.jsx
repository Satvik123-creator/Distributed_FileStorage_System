import React from "react";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../routes/appRoutes.js";

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

  return (
    <section className="dashboard-panel storage-analytics-widget">
      <div className="panel-header">
        <div>
          <p className="section-label">Storage Analytics</p>
          <h3>Cluster summary</h3>
        </div>
        <button
          type="button"
          className="file-action-button file-action-primary"
          onClick={() => navigate(APP_PATHS.storageAnalytics)}
        >
          View Analytics
        </button>
      </div>
      <div className="storage-analytics-widget-grid">
        <div className="sa-widget-stat">
          <span>Total Storage</span>
          <strong>{formatBytes(totalStorage)}</strong>
        </div>
        <div className="sa-widget-stat">
          <span>Total Files</span>
          <strong>{totalFiles}</strong>
        </div>
        <div className="sa-widget-stat">
          <span>Healthy Nodes</span>
          <strong>{healthyCount}/{nodes.length}</strong>
        </div>
        <div className="sa-widget-stat">
          <span>Avg Load</span>
          <strong>
            {nodes.length > 0
              ? `${((totalStorage / nodes.length / (Math.max(...nodes.map((n) => n.storageUsed), 1) || 1)) * 100).toFixed(0)}%`
              : "N/A"}
          </strong>
        </div>
      </div>
    </section>
  );
});

export default StorageAnalyticsWidget;
