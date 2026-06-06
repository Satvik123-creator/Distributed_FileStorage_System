import React from "react";

const statusMeta = {
  healthy: { label: "Healthy", className: "status-healthy", icon: "●" },
  warning: { label: "Warning", className: "status-warning", icon: "●" },
  offline: { label: "Offline", className: "status-offline", icon: "●" },
  unknown: { label: "Unknown", className: "status-unknown", icon: "●" },
};

const NodeStatusCard = ({
  nodeName,
  status,
  lastChecked,
  onClick,
  selected,
}) => {
  const normalizedStatus = String(status || "unknown").toLowerCase();
  const meta = statusMeta[normalizedStatus] || statusMeta.unknown;

  return (
    <button
      type="button"
      className={`node-status-card ${selected ? "node-status-card-selected" : ""}`}
      onClick={onClick}
    >
      <div className="node-status-header">
        <div>
          <p className="section-label">Storage Node</p>
          <h3>{nodeName}</h3>
        </div>
        <span className={`status-pill ${meta.className}`}>
          <span className="status-dot">{meta.icon}</span>
          {meta.label}
        </span>
      </div>

      <div className="node-status-meta">
        <div>
          <span>Current Status</span>
          <strong>{meta.label}</strong>
        </div>
        <div>
          <span>Last Checked</span>
          <strong>{lastChecked}</strong>
        </div>
      </div>
    </button>
  );
};

export default NodeStatusCard;
