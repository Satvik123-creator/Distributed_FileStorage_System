import React from "react";

const formatFileSize = (size) => {
  if (typeof size !== "number") return size || "Unknown";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024)
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const FileTable = ({
  files,
  onDownload,
  onDelete,
  onShowVersions,
  onShare,
  downloading,
  downloadProgress,
  deleting,
}) => {
  return (
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
            const isDownloading = downloading === file.fileId;
            const isDeleting = deleting === file.fileId;

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
                      className="file-action-button file-action-secondary"
                      onClick={() => onShowVersions(file)}
                      disabled={isDownloading || isDeleting}
                    >
                      Versions
                    </button>
                    <button
                      type="button"
                      className="file-action-button file-action-secondary"
                      onClick={() => onShare(file)}
                      disabled={isDownloading || isDeleting}
                    >
                      Share
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
  );
};

export default FileTable;
