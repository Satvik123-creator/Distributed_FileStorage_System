import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FileDropZone from "../components/FileDropZone.jsx";
import UploadProgress from "../components/UploadProgress.jsx";
import SelectedFileCard from "../components/SelectedFileCard.jsx";
import UploadSuccessModal from "../components/UploadSuccessModal.jsx";
import fileService from "../services/fileService.js";
import { APP_PATHS } from "../routes/appRoutes.js";
import { useAuth } from "../context/AuthContext.jsx";

const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const getFriendlyError = (error) => {
  if (!error) return "Upload failed. Please try again.";

  if (error.response?.status === 401 || error.response?.status === 403) {
    return "Your session has expired. Please log in again.";
  }

  if (error.response?.status === 413) {
    return `File is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`;
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message === "Network Error") {
    return "Unable to reach the server. Please check your connection and try again.";
  }

  return "Upload failed. Please try again.";
};

const UploadFile = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("Ready to Upload");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const canUpload = useMemo(
    () => Boolean(selectedFile) && !isUploading,
    [selectedFile, isUploading],
  );

  const validateFile = (file) => {
    if (!file) return "Please select a file to upload.";
    if (file.size <= 0) return "Empty files cannot be uploaded.";
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`;
    }
    return null;
  };

  const handleFileSelect = (file) => {
    setError("");
    setSuccessData(null);

    const validationError = validateFile(file);
    if (validationError) {
      setSelectedFile(null);
      setStatus("Ready to Upload");
      setProgress(0);
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    setStatus("Ready to Upload");
    setProgress(0);
  };

  const clearSelectedFile = () => {
    if (isUploading) return;
    setSelectedFile(null);
    setProgress(0);
    setStatus("Ready to Upload");
    setError("");
  };

  const handleUpload = async () => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);
    setStatus("Uploading");
    setError("");
    setProgress(0);

    try {
      const response = await fileService.uploadFile(selectedFile, (event) => {
        if (event.total) {
          const percent = Math.round((event.loaded * 100) / event.total);
          setProgress(percent);
        }
      });

      const payload = response?.data || response;
      setProgress(100);
      setStatus("Success");
      setSuccessData({
        fileName: selectedFile.name,
        uploadTime: new Date().toLocaleString(),
        primaryNode: payload?.primaryNode,
        nodeLocation: payload?.nodeLocation,
      });
      setSelectedFile(null);
    } catch (err) {
      const friendlyError = getFriendlyError(err);
      setError(friendlyError);
      setStatus("Failed");

      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate(APP_PATHS.login, { replace: true });
      }
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        if (!successData) {
          setProgress((current) => (current === 100 ? 100 : current));
        }
      }, 0);
    }
  };

  const closeSuccessModal = () => setSuccessData(null);

  const uploadAnother = () => {
    closeSuccessModal();
    setStatus("Ready to Upload");
    setProgress(0);
    setError("");
  };

  return (
    <div className="upload-page">
      <section className="hero-panel compact-hero">
        <div>
          <p className="section-label">Cloud Upload</p>
          <h2>Upload File</h2>
          <p className="hero-description">
            Drag and drop a file or browse from your device. Uploads are
            protected by JWT authentication and sent as multipart form data.
          </p>
        </div>
        <div
          className={`hero-badge ${status === "Success" ? "hero-badge-success" : ""}`}
        >
          {status}
        </div>
      </section>

      {error && <div className="feedback-banner feedback-error">{error}</div>}

      <div className="upload-grid">
        <div className="upload-main-column">
          <FileDropZone
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            disabled={isUploading}
          />

          {selectedFile && (
            <>
              <SelectedFileCard
                file={selectedFile}
                onClear={clearSelectedFile}
              />
              <div className="upload-actions-row">
                <button
                  type="button"
                  className="file-action-button file-action-primary upload-button"
                  onClick={handleUpload}
                  disabled={!canUpload}
                >
                  {isUploading ? "Uploading..." : "Upload File"}
                </button>
                <div className="upload-limit-note">
                  Maximum file size: {MAX_FILE_SIZE_MB} MB
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="upload-side-panel">
          <UploadProgress status={status} progress={progress} />
          <div className="upload-status-card">
            <h3>Upload States</h3>
            <ul>
              <li>Ready to Upload</li>
              <li>Uploading</li>
              <li>Success</li>
              <li>Failed</li>
            </ul>
          </div>
        </aside>
      </div>

      <UploadSuccessModal
        isOpen={Boolean(successData)}
        uploadData={successData}
        onUploadAnother={uploadAnother}
        onGoToMyFiles={() => navigate(APP_PATHS.myFiles)}
      />
    </div>
  );
};

export default UploadFile;
