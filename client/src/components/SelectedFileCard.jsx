import React from "react";

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const SelectedFileCard = ({ file, onClear }) => {
  if (!file) return null;

  return (
    <article className="selected-file-card">
      <div className="selected-file-header">
        <div>
          <p className="section-label">Selected File</p>
          <h3>{file.name}</h3>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={onClear}
          aria-label="Remove selected file"
        >
          ✕
        </button>
      </div>

      <div className="selected-file-meta">
        <div>
          <span>File Size</span>
          <strong>{formatBytes(file.size)}</strong>
        </div>
        <div>
          <span>File Type</span>
          <strong>{file.type || "Unknown"}</strong>
        </div>
      </div>
    </article>
  );
};

export default SelectedFileCard;
