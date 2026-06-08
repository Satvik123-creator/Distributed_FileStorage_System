import React, { useCallback, useEffect, useMemo, useState } from "react";
import shareService from "../services/shareService.js";
import fileService from "../services/fileService.js";
import EmptyState from "../components/EmptyState.jsx";
import ShareModal from "../components/ShareModal.jsx";
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

const SharedByMe = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [userFiles, setUserFiles] = useState([]);

  const fetchSharedByMe = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await shareService.getSharedByMe();
      setShares(data);
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
    fetchSharedByMe();
  }, [fetchSharedByMe]);

  const handleOpenShareModal = async () => {
    setError("");
    try {
      const files = await fileService.getMyFiles();
      setUserFiles(files);
      setShareModalOpen(true);
    } catch (err) {
      setError("Failed to load files. Please try again.");
    }
  };

  const handleCloseShareModal = () => {
    setShareModalOpen(false);
    setUserFiles([]);
  };

  const handleShare = async (fileId, email, permissions) => {
    setSharing(true);
    try {
      await shareService.shareFile(fileId, email, permissions);
      handleCloseShareModal();
      fetchSharedByMe();
    } catch (err) {
      throw err;
    } finally {
      setSharing(false);
    }
  };

  const handleRemoveShare = async (shareId) => {
    setError("");
    try {
      await shareService.removeShare(shareId);
      setShares((current) => current.filter((s) => s.shareId !== shareId));
    } catch (err) {
      const friendlyError = getFriendlyError(err);
      setError(friendlyError);
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate(APP_PATHS.login, { replace: true });
      }
    }
  };

  const shareCount = useMemo(() => shares.length, [shares]);

  return (
    <div className="shared-files-page">
      <section className="hero-panel compact-hero">
        <div>
          <p className="section-label">Sharing</p>
          <h2>Shared by Me</h2>
          <p className="hero-description">
            Files you have shared with others. Manage permissions and remove access.
          </p>
        </div>
        <div className="hero-badge">{shareCount} Shared</div>
      </section>

      <div style={{ marginBottom: "20px" }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleOpenShareModal}
        >
          Share File
        </button>
      </div>

      {error && <div className="feedback-banner feedback-error">{error}</div>}

      {loading ? (
        <div className="loading-state-card">
          <div className="spinner" />
          <p>Loading shared files...</p>
        </div>
      ) : shares.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="files-shared-grid">
          {shares.map((share) => (
            <article key={share.shareId} className="file-card">
              <div className="file-card-top">
                <div>
                  <p className="file-label">File Name</p>
                  <h3>{share.originalName}</h3>
                </div>
                <span className="file-type-pill">{share.mimeType || "Unknown"}</span>
              </div>

              <div className="file-meta-grid">
                <div>
                  <span>File Size</span>
                  <strong>{formatFileSize(share.fileSize)}</strong>
                </div>
                <div>
                  <span>Shared With</span>
                  <strong>{share.sharedWith?.name || share.email || "Unknown"}</strong>
                </div>
                <div>
                  <span>Shared Date</span>
                  <strong>{new Date(share.sharedAt).toLocaleString()}</strong>
                </div>
                <div>
                  <span>Permissions</span>
                  <strong>{share.permissions?.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(", ") || "View"}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{share.status === "accepted" ? "Accepted" : "Pending"}</strong>
                </div>
              </div>

              <div className="file-card-actions">
                <button
                  type="button"
                  className="file-action-button file-action-danger"
                  onClick={() => handleRemoveShare(share.shareId)}
                >
                  Remove Access
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ShareModal
        isOpen={shareModalOpen}
        file={null}
        userFiles={userFiles}
        onClose={handleCloseShareModal}
        onShare={handleShare}
        loading={sharing}
      />
    </div>
  );
};

export default SharedByMe;
