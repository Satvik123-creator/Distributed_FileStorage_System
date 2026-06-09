import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutGrid, List } from "lucide-react";
import fileService from "../services/fileService.js";
import FileCard from "../components/FileCard.jsx";
import FileTable from "../components/FileTable.jsx";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal.jsx";
import VersionHistoryModal from "../components/VersionHistoryModal.jsx";
import ShareModal from "../components/ShareModal.jsx";
import EmptyState from "../components/EmptyState.jsx";
import shareService from "../services/shareService.js";
import { APP_PATHS } from "../routes/appRoutes.js";
import { useAuth } from "../context/AuthContext.jsx";

const getFriendlyError = (error) => {
  if (!error) return "Something went wrong.";
  if (error.response?.status === 401 || error.response?.status === 403) {
    return "Your session has expired. Please log in again.";
  }
  if (error.response?.status === 404) {
    return error.response?.data?.message || "File not found.";
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message === "Network Error") {
    return "Unable to connect to the server. Please try again later.";
  }
  return "We could not complete that action. Please try again.";
};

const SkeletonGrid = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="rounded-xl border border-gray-800 bg-gray-900 p-4 animate-pulse">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gray-800 flex-shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="h-4 bg-gray-800 rounded w-3/4" />
            <div className="h-3 bg-gray-800 rounded w-1/2" />
          </div>
        </div>
        <div className="flex gap-1.5 mt-3">
          <div className="h-5 bg-gray-800 rounded w-16" />
          <div className="h-5 bg-gray-800 rounded w-16" />
        </div>
        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-800">
          <div className="h-8 bg-gray-800 rounded-lg flex-1" />
          <div className="h-8 bg-gray-800 rounded-lg flex-1" />
          <div className="h-8 bg-gray-800 rounded-lg w-8" />
        </div>
      </div>
    ))}
  </div>
);

const SkeletonTable = () => (
  <div className="rounded-xl border border-gray-800 bg-gray-900 animate-pulse">
    <div className="p-4 space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-gray-800 flex-shrink-0" />
          <div className="h-4 bg-gray-800 rounded w-1/4" />
          <div className="h-4 bg-gray-800 rounded w-16 ml-auto" />
          <div className="h-4 bg-gray-800 rounded w-12" />
          <div className="h-4 bg-gray-800 rounded w-20" />
          <div className="h-4 bg-gray-800 rounded w-16" />
        </div>
      ))}
    </div>
  </div>
);

const MyFiles = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  const [modalFile, setModalFile] = useState(null);
  const [versionsModal, setVersionsModal] = useState({ open: false, file: null, versions: [] });
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionDeletingId, setVersionDeletingId] = useState(null);
  const [versionRestoringId, setVersionRestoringId] = useState(null);
  const [shareModal, setShareModal] = useState({ open: false, file: null });
  const [sharing, setSharing] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fileService.getMyFiles();
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
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDownload = async (file) => {
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

  const handleShowVersions = useCallback(async (file) => {
    setVersionsLoading(true);
    try {
      const versions = await fileService.getFileVersions(file.fileId);
      setVersionsModal({ open: true, file, versions });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load versions");
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate(APP_PATHS.login, { replace: true });
      }
    } finally {
      setVersionsLoading(false);
    }
  }, [logout, navigate]);

  const handleCloseVersions = () => {
    setVersionsModal({ open: false, file: null, versions: [] });
  };

  const handleVersionDownload = async (versionFile) => {
    setDownloadingId(versionFile.fileId);
    setDownloadProgress(0);
    try {
      const blob = await fileService.downloadFile(versionFile.fileId, (event) => {
        if (event.total) {
          setDownloadProgress(Math.round((event.loaded * 100) / event.total));
        }
      });
      const ext = versionFile.originalName.substring(versionFile.originalName.lastIndexOf("."));
      const base = versionFile.originalName.substring(0, versionFile.originalName.lastIndexOf("."));
      const displayName = versionFile.version > 1 ? `${base}_v${versionFile.version}${ext}` : versionFile.originalName;
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = displayName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download version");
    } finally {
      setDownloadingId(null);
      setDownloadProgress(0);
    }
  };

  const handleVersionRestore = async (versionFile) => {
    setVersionRestoringId(versionFile.fileId);
    try {
      const restored = await fileService.restoreVersion(versionFile.fileId);
      setVersionsModal((prev) => ({
        ...prev,
        versions: [...prev.versions, restored].sort((a, b) => a.version - b.version),
      }));
      setFiles((prev) => {
        const exists = prev.some((f) => f.fileId === restored.fileId);
        return exists ? prev : [{ ...restored, nodeLocation: restored.nodeLocation || versionFile.nodeLocation }, ...prev];
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to restore version");
    } finally {
      setVersionRestoringId(null);
    }
  };

  const handleVersionDelete = async (versionFile) => {
    setVersionDeletingId(versionFile.fileId);
    try {
      await fileService.deleteFile(versionFile.fileId);
      setVersionsModal((prev) => ({
        ...prev,
        versions: prev.versions.filter((v) => v.fileId !== versionFile.fileId),
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete version");
    } finally {
      setVersionDeletingId(null);
    }
  };

  const handleOpenDeleteModal = (file) => setModalFile(file);
  const handleCloseDeleteModal = () => setModalFile(null);

  const handleOpenShareModal = (file) => {
    setShareModal({ open: true, file });
  };

  const handleCloseShareModal = () => {
    setShareModal({ open: false, file: null });
  };

  const handleShare = async (fileId, email, permissions) => {
    setSharing(true);
    try {
      await shareService.shareFile(fileId, email, permissions);
    } finally {
      setSharing(false);
    }
  };

  const handleConfirmDelete = async (file) => {
    setDeletingId(file.fileId);
    setError("");

    try {
      await fileService.deleteFile(file.fileId);
      setFiles((currentFiles) =>
        currentFiles.filter((item) => item.fileId !== file.fileId),
      );
      handleCloseDeleteModal();
    } catch (err) {
      const friendlyError = getFriendlyError(err);
      setError(friendlyError);

      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate(APP_PATHS.login, { replace: true });
      }
    } finally {
      setDeletingId(null);
    }
  };

  const fileCount = useMemo(() => files.length, [files]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-100">My Files</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your uploaded files
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 font-medium">{fileCount} file{fileCount !== 1 ? "s" : ""}</span>
          <div className="flex items-center gap-0.5 p-0.5 bg-gray-800 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "grid" ? "bg-gray-900 text-gray-100 shadow-sm" : "text-gray-500 hover:text-gray-300"
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "list" ? "bg-gray-900 text-gray-100 shadow-sm" : "text-gray-500 hover:text-gray-300"
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl text-sm bg-red-900/30 text-red-400 border border-red-800">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        viewMode === "grid" ? <SkeletonGrid /> : <SkeletonTable />
      ) : files.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {files.map((file) => (
                <FileCard
                  key={file.fileId}
                  file={file}
                  onDownload={handleDownload}
                  onDelete={handleOpenDeleteModal}
                  onShowVersions={handleShowVersions}
                  onShare={handleOpenShareModal}
                  downloading={downloadingId}
                  downloadProgress={downloadProgress}
                  deleting={deletingId}
                />
              ))}
            </div>
          ) : (
            <FileTable
              files={files}
              onDownload={handleDownload}
              onDelete={handleOpenDeleteModal}
              onShowVersions={handleShowVersions}
              onShare={handleOpenShareModal}
              downloading={downloadingId}
              downloadProgress={downloadProgress}
              deleting={deletingId}
            />
          )}
        </>
      )}

      {/* Modals */}
      <VersionHistoryModal
        isOpen={versionsModal.open}
        versions={versionsModal.versions}
        fileName={versionsModal.file?.originalName || ""}
        onClose={handleCloseVersions}
        onDownload={handleVersionDownload}
        onDeleteVersion={handleVersionDelete}
        onRestoreVersion={handleVersionRestore}
        downloading={downloadingId}
        deleting={versionDeletingId}
        restoring={versionRestoringId}
      />

      <ShareModal
        isOpen={shareModal.open}
        file={shareModal.file}
        onClose={handleCloseShareModal}
        onShare={handleShare}
        loading={sharing}
      />

      <DeleteConfirmationModal
        isOpen={Boolean(modalFile)}
        file={modalFile}
        onCancel={handleCloseDeleteModal}
        onDelete={handleConfirmDelete}
        loading={deletingId === modalFile?.fileId}
      />
    </motion.div>
  );
};

export default MyFiles;
