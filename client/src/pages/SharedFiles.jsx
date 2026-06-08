import React, { useCallback, useEffect, useMemo, useState } from "react";
import shareService from "../services/shareService.js";
import fileService from "../services/fileService.js";
import EmptyState from "../components/EmptyState.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../routes/appRoutes.js";

const formatFileSize = (size) => {
  if (typeof size !== "number") return size || "Unknown";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const getFriendlyError = (error) => {
  if (!error) return "Something went wrong.";
  if (error.response?.status === 401 || error.response?.status === 403) return "Your session has expired. Please log in again.";
  if (error.response?.data?.message) return error.response.data.message;
  if (error.message === "Network Error") return "Unable to connect to the server. Please try again later.";
  return "We could not complete that action. Please try again.";
};

const SharedFiles = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const fetchSharedFiles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await shareService.getSharedWithMe();
      setFiles(data);
    } catch (err) {
      const friendlyError = getFriendlyError(err);
      setError(friendlyError);
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate(APP_PATHS.login, { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    fetchSharedFiles();
  }, [fetchSharedFiles]);

  const handleDownload = async (file) => {
    const canDownload = file.permissions.includes("download") || file.permissions.includes("edit");
    if (!canDownload) {
      setError("You do not have download permission for this file");
      return;
    }

    setDownloadingId(file.fileId);
    setDownloadProgress(0);
    setError("");

    try {
      const blob = await fileService.downloadFile(file.fileId, (event) => {
        if (event.total) {
          const percent = Math.round((event.loaded * 100) / event.total);
          setDownloadProgress(percent);
        }
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = file.originalName || "download";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      const friendlyError = getFriendlyError(err);
      setError(friendlyError);
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate(APP_PATHS.login, { replace: true });
      }
    } finally {
      setDownloadingId(null);
      setDownloadProgress(0);
    }
  };

  const fileCount = useMemo(() => files.length, [files]);

  return (
    <div className="shared-files-page">
      <section className="hero-panel compact-hero">
        <div>
          <p className="section-label">Shared with Me</p>
          <h2>Shared Files</h2>
          <p className="hero-description">
            Files that others have shared with you. Download based on your permissions.
          </p>
        </div>
        <div className="hero-badge">{fileCount} Files</div>
      </section>

      {error && <div className="feedback-banner feedback-error">{error}</div>}

      {loading ? (
        <div className="loading-state-card">
          <div className="spinner" />
          <p>Loading shared files...</p>
        </div>
      ) : files.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="files-shared-grid">
          {files.map((file) => {
            const isDownloading = downloadingId === file.fileId;
            const canDownload = file.permissions.includes("download") || file.permissions.includes("edit");

            return (
              <article key={file.shareId} className="file-card">
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
                    <span>Shared by</span>
                    <strong>{file.sharedBy?.name || file.sharedBy?.email || "Unknown"}</strong>
                  </div>
                  <div>
                    <span>Permission</span>
                    <strong>{file.permissions?.join(", ") || "view"}</strong>
                  </div>
                </div>

                <div className="file-card-actions">
                  <button
                    type="button"
                    className="file-action-button file-action-primary"
                    onClick={() => handleDownload(file)}
                    disabled={isDownloading || !canDownload}
                    title={!canDownload ? "No download permission" : ""}
                  >
                    {isDownloading
                      ? `Downloading${downloadProgress ? ` ${downloadProgress}%` : "..."}`
                      : "Download"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SharedFiles;
