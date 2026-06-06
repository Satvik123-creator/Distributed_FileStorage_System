import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { APP_PATHS } from "../routes/appRoutes.js";
import fileService from "../services/fileService.js";
import SearchBar from "../components/SearchBar.jsx";
import SearchFilters from "../components/SearchFilters.jsx";
import SearchResults from "../components/SearchResults.jsx";
import NoResults from "../components/NoResults.jsx";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal.jsx";

const defaultDraftFilters = {
  name: "",
  mimeType: "",
  startDate: "",
  endDate: "",
};

const defaultSearchParams = {
  name: "",
  mimeType: "",
  startDate: "",
  endDate: "",
};

const useDebouncedValue = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

const formatSearchError = (error) => {
  if (!error) return "Search failed. Please try again.";

  if (error.response?.status === 401 || error.response?.status === 403) {
    return "Your session has expired. Please log in again.";
  }

  if (error.response?.status === 400) {
    return error.response?.data?.message || "Invalid search parameters.";
  }

  if (error.message === "Network Error") {
    return "Unable to connect to the server. Please try again later.";
  }

  return error.response?.data?.message || "Search failed. Please try again.";
};

const SearchFiles = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [draftFilters, setDraftFilters] = useState(defaultDraftFilters);
  const [searchParams, setSearchParams] = useState(defaultSearchParams);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  const [modalFile, setModalFile] = useState(null);

  const debouncedName = useDebouncedValue(draftFilters.name, 350);

  useEffect(() => {
    setSearchParams((current) => {
      if (current.name === debouncedName) return current;
      return { ...current, name: debouncedName };
    });
  }, [debouncedName]);

  const applySearch = () => {
    if (
      draftFilters.startDate &&
      draftFilters.endDate &&
      draftFilters.startDate > draftFilters.endDate
    ) {
      setError("Start Date cannot be after End Date.");
      return;
    }

    setError("");
    setSearchParams({ ...draftFilters });
  };

  const resetFilters = () => {
    setDraftFilters(defaultDraftFilters);
    setSearchParams(defaultSearchParams);
    setError("");
  };

  const fetchSearchResults = async (params) => {
    setLoading(true);
    setError("");

    try {
      const results = await fileService.searchFiles(params);
      setFiles(results);
    } catch (err) {
      const friendlyError = formatSearchError(err);
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
    if (
      draftFilters.startDate &&
      draftFilters.endDate &&
      draftFilters.startDate > draftFilters.endDate
    ) {
      setFiles([]);
      setLoading(false);
      setError("Start Date cannot be after End Date.");
      return;
    }

    fetchSearchResults(searchParams);
  }, [searchParams]);

  const updateFilter = (key, value) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

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
      const friendlyError = formatSearchError(err);
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
      const friendlyError = formatSearchError(err);
      setError(friendlyError);

      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate(APP_PATHS.login, { replace: true });
      }
    } finally {
      setDeletingId(null);
    }
  };

  const hasFilters = useMemo(
    () =>
      Object.values(searchParams).some(
        (value) => String(value || "").trim() !== "",
      ),
    [searchParams],
  );

  return (
    <div className="search-files-page">
      <section className="hero-panel compact-hero">
        <div>
          <p className="section-label">Search Storage</p>
          <h2>Search Files</h2>
          <p className="hero-description">
            Search by filename, file type, or upload date range. Empty searches
            return all your files.
          </p>
        </div>
        <div className="hero-badge">{files.length} Results</div>
      </section>

      <SearchBar
        value={draftFilters.name}
        onChange={(value) => updateFilter("name", value)}
        onSearch={applySearch}
        onReset={resetFilters}
        loading={loading}
      />

      <SearchFilters filters={draftFilters} onChange={updateFilter} />

      {error && <div className="feedback-banner feedback-error">{error}</div>}

      {loading ? (
        <div className="loading-state-card">
          <div className="spinner" />
          <p>Searching files...</p>
        </div>
      ) : files.length === 0 ? (
        <NoResults
          title={hasFilters ? "No Matching Files" : "No Files Found"}
          message={
            hasFilters
              ? "No files match the current search filters. Try broadening your query."
              : "No files uploaded yet. Try uploading your first file."
          }
          actionLabel="Upload Your First File"
          onAction={() => navigate(APP_PATHS.uploadFile)}
        />
      ) : (
        <SearchResults
          files={files}
          onDownload={handleDownload}
          onDelete={handleOpenDeleteModal}
          downloadingId={downloadingId}
          deletingId={deletingId}
          downloadProgress={downloadProgress}
        />
      )}

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

export default SearchFiles;
