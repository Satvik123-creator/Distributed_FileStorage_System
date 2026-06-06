import React from "react";

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
