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
    <div className="flex flex-col gap-5">
      <section className="flex items-center justify-between gap-4 p-5 rounded-xl border border-gray-800 bg-gray-900 shadow-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Shared with Me</p>
          <h2 className="text-xl font-bold text-gray-100">Shared Files</h2>
          <p className="text-sm text-gray-500 max-w-[760px]">
            Files that others have shared with you. Download based on your permissions.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-gray-800 text-gray-300 text-sm font-semibold rounded-lg">{fileCount} Files</div>
      </section>

      {error && <div className="px-4 py-3 rounded-xl text-sm bg-red-900/30 text-red-400 border border-red-800">{error}</div>}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 p-10 rounded-xl border border-gray-800 bg-gray-900 shadow-sm">
          <div className="w-8 h-8 border-3 border-gray-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading shared files...</p>
        </div>
      ) : files.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {files.map((file) => {
            const isDownloading = downloadingId === file.fileId;
            const canDownload = file.permissions.includes("download") || file.permissions.includes("edit");

            return (
              <article key={file.shareId} className="p-5 rounded-xl border border-gray-800 bg-gray-900 shadow-sm grid gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">File Name</p>
                    <h3 className="text-lg font-bold text-gray-100">{file.originalName}</h3>
                  </div>
                  <span className="px-2.5 py-1 bg-gray-800 text-gray-300 text-[11px] font-bold uppercase rounded-md">{file.mimeType || "Unknown"}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-gray-400">File Size</span>
                    <strong className="text-gray-100">{formatFileSize(file.fileSize)}</strong>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-gray-400">Shared Date</span>
                    <strong className="text-gray-100">{file.sharedAt ? new Date(file.sharedAt).toLocaleString() : new Date(file.uploadedAt).toLocaleString()}</strong>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-gray-400">Shared by</span>
                    <strong className="text-gray-100">{file.sharedBy?.name || file.sharedBy?.email || "Unknown"}</strong>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-gray-400">Permission</span>
                    <strong className="text-gray-100">{file.permissions?.join(", ") || "view"}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
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
