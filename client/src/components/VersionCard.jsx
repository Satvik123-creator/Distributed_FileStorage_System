import React from "react";

const formatFileSize = (size) => {
  if (typeof size !== "number") return size || "Unknown";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const VersionCard = React.memo(({
  version,
  fileName,
  onDownload,
  onDelete,
  onRestore,
  downloading,
  deleting,
  restoring,
}) => {
  const isDownloading = downloading === version.fileId;
  const isDeleting = deleting === version.fileId;
  const isRestoring = restoring === version.fileId;
  const disabled = isDownloading || isDeleting || isRestoring;

  const ext = fileName.substring(fileName.lastIndexOf("."));
  const base = fileName.substring(0, fileName.lastIndexOf("."));
  const displayName = version.version > 1 ? `${base}_v${version.version}${ext}` : fileName;

  return (
    <article className="version-card">
      <div className="version-card-badge">v{version.version}</div>

      <div className="version-card-body">
        <div className="version-card-meta">
          <span className="version-card-name">{displayName}</span>
          <span className="version-card-detail">{formatFileSize(version.fileSize)}</span>
          <span className="version-card-detail">{new Date(version.uploadedAt).toLocaleString()}</span>
        </div>
      </div>

      <div className="version-card-actions">
        <button
          type="button"
          className="file-action-button file-action-primary"
          onClick={() => onDownload(version)}
          disabled={disabled}
        >
          {isDownloading ? "DL..." : "Download"}
        </button>
        {version.version > 1 && (
          <button
            type="button"
            className="file-action-button file-action-secondary"
            onClick={() => onDelete(version)}
            disabled={disabled}
          >
            {isDeleting ? "Del..." : "Delete"}
          </button>
        )}
        <button
          type="button"
          className="file-action-button file-action-restore"
          onClick={() => onRestore(version)}
          disabled={disabled}
        >
          {isRestoring ? "Res..." : "Restore"}
        </button>
      </div>
    </article>
  );
});

export default VersionCard;
