import React from "react";
import SearchResultCard from "./SearchResultCard.jsx";

const formatFileSize = (size) => {
  if (typeof size !== "number") return size || "Unknown";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024)
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const SearchResults = ({
  files,
  onDownload,
  onDelete,
  downloadingId,
  deletingId,
  downloadProgress,
}) => {
  return (
    <div className="search-results">
      <div className="desktop-only-view">
        <div className="files-table-wrap">
          <table className="files-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>File Size</th>
                <th>File Type</th>
                <th>Upload Date</th>
                <th>Node Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => {
                const isDownloading = downloadingId === file.fileId;
                const isDeleting = deletingId === file.fileId;

                return (
                  <tr key={file.fileId}>
                    <td>
                      <div className="table-primary-cell">
                        <strong>{file.originalName}</strong>
                        <span className="table-subtext">ID: {file.fileId}</span>
                      </div>
                    </td>
                    <td>{formatFileSize(file.fileSize)}</td>
                    <td>{file.mimeType || "Unknown"}</td>
                    <td>{new Date(file.uploadedAt).toLocaleString()}</td>
                    <td>{file.nodeLocation || "Unknown"}</td>
                    <td>
                      <div className="table-action-group">
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mobile-only-view">
        <div className="files-card-stack">
          {files.map((file) => (
            <SearchResultCard
              key={file.fileId}
              file={file}
              onDownload={onDownload}
              onDelete={onDelete}
              downloadingId={downloadingId}
              deletingId={deletingId}
              downloadProgress={downloadProgress}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
