import React from "react";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../routes/appRoutes.js";

const EncryptionWidget = React.memo(({ encryptionStatus }) => {
  const navigate = useNavigate();

  const {
    enabled = false,
    algorithm = "aes-256-gcm",
    keyVersion = null,
    encryptedFileCount = 0,
    totalFileCount = 0,
    encryptionRate = 0,
  } = encryptionStatus || {};

  const label = (algorithm || "aes-256-gcm").toUpperCase().replace(/-/g, "-");

  return (
    <section className="dashboard-panel encryption-widget">
      <div className="panel-header">
        <div>
          <p className="section-label">Encryption</p>
          <h3>Encryption Coverage</h3>
        </div>
        <button
          type="button"
          className="file-action-button file-action-primary"
          onClick={() => navigate(APP_PATHS.storageAnalytics)}
        >
          View Details
        </button>
      </div>

      <div className="encryption-coverage-card">
        <div className="encryption-coverage-header">
          <span className="encryption-coverage-label">Coverage</span>
          <strong className="encryption-coverage-value">{encryptionRate}%</strong>
          <span className="encryption-coverage-files">
            ({encryptedFileCount} of {totalFileCount} files)
          </span>
        </div>
        <div className="encryption-progress-track">
          <div
            className="encryption-progress-fill"
            style={{ width: `${Math.min(encryptionRate, 100)}%` }}
          />
        </div>
      </div>

      <div className="encryption-stats-grid">
        <div className="encryption-stat">
          <span>Encrypted Files</span>
          <strong>{encryptedFileCount}</strong>
        </div>
        <div className="encryption-stat">
          <span>Total Files</span>
          <strong>{totalFileCount}</strong>
        </div>
        <div className="encryption-stat">
          <span>Algorithm</span>
          <strong>{label}</strong>
        </div>
      </div>

      <div className={`encryption-status-row ${enabled ? "encryption-active" : "encryption-inactive"}`}>
        <span className="encryption-status-indicator" />
        <div className="encryption-status-info">
          <strong>Encryption: {enabled ? "Active" : "Inactive"}</strong>
          {keyVersion != null && (
            <span className="encryption-status-detail">Key v{keyVersion}</span>
          )}
        </div>
      </div>
    </section>
  );
});

export default EncryptionWidget;
