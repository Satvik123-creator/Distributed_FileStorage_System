import React from "react";

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const StorageUsageWidget = React.memo(({ categories, totalBytes }) => {
  return (
    <section className="dashboard-panel">
      <div className="panel-header">
        <div>
          <p className="section-label">Storage Usage</p>
          <h3>Usage breakdown</h3>
        </div>
        <span>Total used: {formatBytes(totalBytes)}</span>
      </div>

      <div className="storage-usage-list">
        {categories.map((category) => (
          <article key={category.label} className="storage-usage-row">
            <div className="storage-usage-label-row">
              <strong>{category.label}</strong>
              <span>{category.percent}%</span>
            </div>
            <div className="usage-track">
              <div
                className="usage-fill"
                style={{ width: `${category.percent}%` }}
              />
            </div>
            <span className="node-health-meta">
              {formatBytes(category.bytes)}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
});

export default StorageUsageWidget;
