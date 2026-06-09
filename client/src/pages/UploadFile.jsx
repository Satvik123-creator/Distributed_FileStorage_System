import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Shield, Server as ServerIcon } from "lucide-react";
import FileDropZone from "../components/FileDropZone.jsx";
import UploadProgress from "../components/UploadProgress.jsx";
import SelectedFileCard from "../components/SelectedFileCard.jsx";
import UploadSuccessModal from "../components/UploadSuccessModal.jsx";
import ChunkedUploadManager from "../components/ChunkedUploadManager.jsx";
import fileService from "../services/fileService.js";
import { APP_PATHS } from "../routes/appRoutes.js";
import { useAuth } from "../context/AuthContext.jsx";

const MAX_FILE_SIZE_MB = 25;
const CHUNKED_UPLOAD_THRESHOLD = 10 * 1024 * 1024;

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
  const [chunkedUpload, setChunkedUpload] = useState(null);

  const canUpload = useMemo(
    () => Boolean(selectedFile) && !isUploading && !chunkedUpload,
    [selectedFile, isUploading, chunkedUpload],
  );

  const handleFileSelect = (file) => {
    setError("");
    setSuccessData(null);
    if (!file) return;
    if (file.size <= 0) {
      setError("Empty files cannot be uploaded.");
      return;
    }
    setSelectedFile(file);
    setStatus("Ready to Upload");
    setProgress(0);
  };

  const clearSelectedFile = () => {
    if (isUploading || chunkedUpload) return;
    setSelectedFile(null);
    setProgress(0);
    setStatus("Ready to Upload");
    setError("");
  };

  const handleChunkedSuccess = (data) => {
    setChunkedUpload(null);
    setSelectedFile(null);
    setProgress(100);
    setStatus("Success");
    setSuccessData({
      fileName: data.originalName || (selectedFile?.name || "file"),
      uploadTime: new Date().toLocaleString(),
      primaryNode: data.primaryNode,
      nodeLocation: data.primaryNode,
    });
  };

  const handleChunkedCancel = () => {
    setChunkedUpload(null);
    setSelectedFile(null);
    setStatus("Ready to Upload");
    setProgress(0);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    if (selectedFile.size > CHUNKED_UPLOAD_THRESHOLD) {
      setChunkedUpload(selectedFile);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`);
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-5 rounded-xl border border-gray-800 bg-gray-900 shadow-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">Cloud Upload</p>
          <h2 className="text-xl font-bold text-gray-100 mt-0.5">Upload File</h2>
          <p className="text-sm text-gray-500 mt-1 max-w-[760px]">
            Drag and drop a file or browse from your device. Uploads are protected by JWT authentication and sent as multipart form data.
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${
          status === "Success" ? "bg-emerald-900/30 text-emerald-400" : "bg-gray-800 text-gray-400"
        }`}>
          {status}
        </div>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm bg-red-900/30 text-red-400 border border-red-800">{error}</div>}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        {/* Main column */}
        <div className="flex flex-col gap-4">
          {chunkedUpload ? (
            <ChunkedUploadManager
              file={chunkedUpload}
              onSuccess={handleChunkedSuccess}
              onCancel={handleChunkedCancel}
            />
          ) : (
            <>
              <FileDropZone
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                disabled={isUploading}
              />

              {selectedFile && (
                <>
                  <SelectedFileCard file={selectedFile} onClear={clearSelectedFile} />
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                      onClick={handleUpload}
                      disabled={!canUpload}
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload File
                        </>
                      )}
                    </button>
                    <span className="text-xs text-gray-500">
                      Files up to {MAX_FILE_SIZE_MB} MB upload directly; larger files use chunked upload
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Side panel */}
        <aside className="flex flex-col gap-4">
          {chunkedUpload ? (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 shadow-sm">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                  <ServerIcon className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-100">Chunked Upload Active</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Large file upload in progress. Progress details are shown in the main panel.
              </p>
            </div>
          ) : (
            <>
              <UploadProgress status={status} progress={progress} />
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-100 mb-2">Upload States</h3>
                <ul className="space-y-1.5 text-sm text-gray-500">
                  <li className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${status === "Ready to Upload" ? "bg-gray-100" : "bg-gray-700"}`} />
                    Ready to Upload
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${status === "Uploading" ? "bg-gray-100" : "bg-gray-700"}`} />
                    Uploading
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${status === "Success" ? "bg-emerald-500" : "bg-gray-700"}`} />
                    Success
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${status === "Failed" ? "bg-red-500" : "bg-gray-700"}`} />
                    Failed
                  </li>
                </ul>
              </div>
            </>
          )}
        </aside>
      </div>

      <UploadSuccessModal
        isOpen={Boolean(successData)}
        uploadData={successData}
        onUploadAnother={uploadAnother}
        onGoToMyFiles={() => navigate(APP_PATHS.myFiles)}
      />
    </motion.div>
  );
};

export default UploadFile;
