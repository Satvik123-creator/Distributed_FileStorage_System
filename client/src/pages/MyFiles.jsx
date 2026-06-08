import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import fileService from "../services/fileService.js";
import FileCard from "../components/FileCard.jsx";
import FileTable from "../components/FileTable.jsx";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal.jsx";
import VersionHistoryModal from "../components/VersionHistoryModal.jsx";
import EmptyState from "../components/EmptyState.jsx";
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

const MyFiles = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  const [modalFile, setModalFile] = useState(null);
  const [versionsModal, setVersionsModal] = useState({ open: false, file: null, versions: [] });
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionDeletingId, setVersionDeletingId] = useState(null);

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
    <div className="my-files-page">
      <section className="hero-panel compact-hero">
        <div>
          <p className="section-label">File Manager</p>
          <h2>My Files</h2>
          <p className="hero-description">
            Review uploaded files, download them to your device, or remove them
            from storage.
          </p>
        </div>
        <div className="hero-badge">{fileCount} Files</div>
      </section>

      {error && <div className="feedback-banner feedback-error">{error}</div>}

      {loading ? (
        <div className="loading-state-card">
          <div className="spinner" />
          <p>Loading your files...</p>
        </div>
      ) : files.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="desktop-only-view">
            <FileTable
              files={files}
              onDownload={handleDownload}
              onDelete={handleOpenDeleteModal}
              onShowVersions={handleShowVersions}
              downloading={downloadingId}
              downloadProgress={downloadProgress}
              deleting={deletingId}
            />
          </div>

          <div className="mobile-only-view">
            <div className="files-card-stack">
              {files.map((file) => (
                <FileCard
                  key={file.fileId}
                  file={file}
                  onDownload={handleDownload}
                  onDelete={handleOpenDeleteModal}
                  onShowVersions={handleShowVersions}
                  downloading={downloadingId}
                  downloadProgress={downloadProgress}
                  deleting={deletingId}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <VersionHistoryModal
        isOpen={versionsModal.open}
        versions={versionsModal.versions}
        fileName={versionsModal.file?.originalName || ""}
        onClose={handleCloseVersions}
        onDownload={handleVersionDownload}
        onDeleteVersion={handleVersionDelete}
        downloading={downloadingId}
        deleting={versionDeletingId}
      />

      <DeleteConfirmationModal
        isOpen={Boolean(modalFile)}
        file={modalFile}
        onCancel={handleCloseDeleteModal}
        onDelete={handleConfirmDelete}
        loading={deletingId === modalFile?.fileId}
      />
    </div>
  );
};

export default MyFiles;
