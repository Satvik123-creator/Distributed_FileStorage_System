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

const DedupAnalyticsWidget = React.memo(({ dedupStats }) => {
  const navigate = useNavigate();

  const {
    totalLogicalFiles = 0,
    totalPhysicalFiles = 0,
    logicalBytes = 0,
    physicalBytes = 0,
    savingsBytes = 0,
    savingsPercent = 0,
  } = dedupStats || {};

  const duplicatesPrevented = Math.max(0, totalLogicalFiles - totalPhysicalFiles);

  return (
    <section className="dashboard-panel dedup-analytics-widget">
      <div className="panel-header">
        <div>
          <p className="section-label">Deduplication</p>
          <h3>Storage savings</h3>
        </div>
        <button
          type="button"
          className="file-action-button file-action-primary"
          onClick={() => navigate(APP_PATHS.storageAnalytics)}
        >
          View Details
        </button>
      </div>

      <div className="dedup-savings-card">
        <div className="dedup-savings-header">
          <span className="dedup-savings-label">Storage Saved</span>
          <strong className="dedup-savings-value">{formatBytes(savingsBytes)}</strong>
          <span className="dedup-savings-pct">({savingsPercent}%)</span>
        </div>
        <div className="dedup-progress-track">
          <div
            className="dedup-progress-fill"
            style={{ width: `${Math.min(savingsPercent, 100)}%` }}
          />
        </div>
      </div>

      <div className="dedup-stats-grid">
        <div className="dedup-stat">
          <span>Total Uploads</span>
          <strong>{totalLogicalFiles}</strong>
        </div>
        <div className="dedup-stat">
          <span>Actual Stored Files</span>
          <strong>{totalPhysicalFiles}</strong>
        </div>
        <div className="dedup-stat">
          <span>Duplicate Files Prevented</span>
          <strong>{duplicatesPrevented}</strong>
        </div>
      </div>

      <div className="dedup-bar-section">
        <div className="dedup-bar-labels">
          <span>Logical ({formatBytes(logicalBytes)})</span>
          <span>Physical ({formatBytes(physicalBytes)})</span>
        </div>
        <div className="dedup-bar-stack">
          <div
            className="dedup-bar-segment dedup-bar-physical"
            style={{
              width: `${physicalBytes > 0 && logicalBytes > 0 ? (physicalBytes / logicalBytes) * 100 : 0}%`,
            }}
          />
          <div
            className="dedup-bar-segment dedup-bar-savings"
            style={{
              width: `${savingsBytes > 0 && logicalBytes > 0 ? (savingsBytes / logicalBytes) * 100 : 0}%`,
            }}
          />
        </div>
        <div className="dedup-bar-legend">
          <span className="dedup-legend-physical">Unique data</span>
          <span className="dedup-legend-savings">Saved by dedup</span>
        </div>
      </div>
    </section>
  );
});

export default DedupAnalyticsWidget;
