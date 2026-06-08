import React from "react";

const formatFileSize = (size) => {
  if (typeof size !== "number") return size || "Unknown";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024)
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const VersionHistoryModal = ({
  isOpen,
  versions,
  fileName,
  onClose,
  onDownload,
  onDeleteVersion,
  downloading,
  deleting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-card version-history-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="section-label">Version History</p>
            <h3>{fileName}</h3>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="version-list">
          {versions.length === 0 ? (
            <p className="empty-version-message">No versions available.</p>
          ) : (
            versions.map((v) => {
              const isDownloading = downloading === v.fileId;
              const isDeleting = deleting === v.fileId;
              const ext = fileName.substring(fileName.lastIndexOf("."));
              const base = fileName.substring(0, fileName.lastIndexOf("."));
              const displayName =
                v.version > 1 ? `${base}_v${v.version}${ext}` : fileName;

              return (
                <div key={v.fileId} className="version-row">
                  <div className="version-info">
                    <strong className="version-name">v{v.version}</strong>
                    <span className="version-meta">
                      {displayName} &middot; {formatFileSize(v.fileSize)} &middot;{" "}
                      {new Date(v.uploadedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="version-actions">
                    <button
                      type="button"
                      className="file-action-button file-action-primary"
                      onClick={() => onDownload(v)}
                      disabled={isDownloading || isDeleting}
                    >
                      {isDownloading ? "Downloading..." : "Download"}
                    </button>
                    <button
                      type="button"
                      className="file-action-button file-action-danger"
                      onClick={() => onDeleteVersion(v)}
                      disabled={isDeleting || isDownloading}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryModal;
