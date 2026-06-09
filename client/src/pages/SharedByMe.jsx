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
    <div className="flex flex-col gap-5">
      <section className="flex items-center justify-between gap-4 p-5 rounded-xl border border-gray-800 bg-gray-900 shadow-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Sharing</p>
          <h2 className="text-xl font-bold text-gray-100">Shared by Me</h2>
          <p className="text-sm text-gray-500 max-w-[760px]">
            Files you have shared with others. Manage permissions and remove access.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-gray-800 text-gray-300 text-sm font-semibold rounded-lg">{shareCount} Shared</div>
      </section>

      <div className="flex">
        <button
          type="button"
          className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition cursor-pointer"
          onClick={handleOpenShareModal}
        >
          Share File
        </button>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm bg-red-900/30 text-red-400 border border-red-800">{error}</div>}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 p-10 rounded-xl border border-gray-800 bg-gray-900 shadow-sm">
          <div className="w-8 h-8 border-3 border-gray-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading shared files...</p>
        </div>
      ) : shares.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {shares.map((share) => (
            <article key={share.shareId} className="p-5 rounded-xl border border-gray-800 bg-gray-900 shadow-sm grid gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">File Name</p>
                  <h3 className="text-lg font-bold text-gray-100">{share.originalName}</h3>
                </div>
                <span className="px-2.5 py-1 bg-gray-800 text-gray-300 text-[11px] font-bold uppercase rounded-md">{share.mimeType || "Unknown"}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400">File Size</span>
                  <strong className="text-gray-100">{formatFileSize(share.fileSize)}</strong>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400">Shared With</span>
                  <strong className="text-gray-100">{share.sharedWith?.name || share.email || "Unknown"}</strong>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400">Shared Date</span>
                  <strong className="text-gray-100">{new Date(share.sharedAt).toLocaleString()}</strong>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400">Permissions</span>
                  <strong className="text-gray-100">{share.permissions?.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(", ") || "View"}</strong>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400">Status</span>
                  <strong className="text-gray-100">{share.status === "accepted" ? "Accepted" : "Pending"}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition cursor-pointer"
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
