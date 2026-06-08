import React from "react";

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const NodeDetailsModal = ({ isOpen, node, onClose }) => {
  if (!isOpen || !node) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-card node-details-modal"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="section-label">Node Details</p>
            <h3>{node.nodeName}</h3>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close details modal"
          >
            ✕
          </button>
        </div>

        <div className="node-details-grid">
          <div>
            <span>Current Status</span>
            <strong>{node.statusLabel}</strong>
          </div>
          <div>
            <span>Last Health Check</span>
            <strong>{node.lastChecked}</strong>
          </div>
          <div>
            <span>Stored Files Count</span>
            <strong>{node.storedFilesCount ?? "Not available"}</strong>
          </div>
          <div>
            <span>Storage Used</span>
            <strong>{node.storageUsed != null ? formatBytes(node.storageUsed) : "Not available"}</strong>
          </div>
          <div>
            <span>Replica Information</span>
            <strong>{node.replicaInfo || "Not available"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeDetailsModal;
