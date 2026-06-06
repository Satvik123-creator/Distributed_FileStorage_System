import React from "react";

const formatFileSize = (size) => {
  if (typeof size !== "number") return size || "Unknown";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024)
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const SearchResultCard = ({
  file,
  onDownload,
  onDelete,
  downloadingId,
  deletingId,
  downloadProgress,
}) => {
  const isDownloading = downloadingId === file.fileId;
  const isDeleting = deletingId === file.fileId;

  return (
    <article className="file-card">
      <div className="file-card-top">
        <div>
          <p className="file-label">File Name</p>
          <h3>{file.originalName}</h3>
        </div>
        <span className="file-type-pill">{file.mimeType || "Unknown"}</span>
      </div>

      <div className="file-meta-grid">
        <div>
          <span>File Size</span>
          <strong>{formatFileSize(file.fileSize)}</strong>
        </div>
        <div>
          <span>Upload Date</span>
          <strong>{new Date(file.uploadedAt).toLocaleString()}</strong>
        </div>
        <div>
          <span>Node Location</span>
          <strong>{file.nodeLocation || "Unknown"}</strong>
        </div>
      </div>

      <div className="file-card-actions">
        <button
          type="button"
          className="file-action-button file-action-primary"
          onClick={() => onDownload(file)}
          disabled={isDownloading || isDeleting}
        >
          {isDownloading
            ? `Downloading${downloadProgress ? ` ${downloadProgress}%` : "..."}`
            : "Download"}
        </button>
        <button
          type="button"
          className="file-action-button file-action-danger"
          onClick={() => onDelete(file)}
          disabled={isDeleting || isDownloading}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </article>
  );
};

export default SearchResultCard;
