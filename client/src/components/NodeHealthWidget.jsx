import React from "react";

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const statusClass = (status) => {
  const value = String(status || "unknown").toLowerCase();
  if (value === "healthy") return "status-healthy";
  if (value === "warning") return "status-warning";
  if (value === "offline") return "status-offline";
  return "status-unknown";
};

const NodeHealthWidget = React.memo(({ nodes }) => {
  return (
    <section className="dashboard-panel">
      <div className="panel-header">
        <div>
          <p className="section-label">Node Health</p>
          <h3>Storage nodes</h3>
        </div>
        <span>{nodes.length} nodes monitored</span>
      </div>

      <div className="node-health-grid">
        {nodes.map((node) => (
          <article key={node.nodeName} className="node-health-card">
            <div className="node-health-top">
              <strong>{node.nodeName}</strong>
              <span className={`status-pill ${statusClass(node.status)}`}>
                {String(node.status || "unknown").toUpperCase()}
              </span>
            </div>
            <div className="node-health-meta-row">
              <span className="node-health-meta">
                Files: {node.storedFilesCount ?? "N/A"}
              </span>
              <span className="node-health-meta">
                Storage: {node.storageUsed != null ? formatBytes(node.storageUsed) : "N/A"}
              </span>
            </div>
            <span className="node-health-meta">
              Last checked: {node.lastChecked}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
});

export default NodeHealthWidget;
