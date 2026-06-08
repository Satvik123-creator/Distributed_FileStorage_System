import React, { useCallback, useRef, useState } from "react";
import chunkUploadService from "../services/chunkUploadService.js";

const CHUNK_SIZE_MB = 5;

const ChunkedUploadModal = ({ file, onClose, onSuccess }) => {
  const [step, setStep] = useState("preparing");
  const [progress, setProgress] = useState(0);
  const [chunkProgress, setChunkProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const cancelledRef = useRef(false);

  const upload = useCallback(async () => {
    if (!file) return;

    try {
      const totalChunks = Math.ceil(file.size / chunkUploadService.CHUNK_SIZE);
      setChunkProgress({ current: 0, total: totalChunks });
      setStep("initialising");

      const initData = await chunkUploadService.initUpload(file);
      const { uploadId } = initData;
      const chunks = chunkUploadService.splitFileIntoChunks(file);

      setStep("uploading");

      for (const chunk of chunks) {
        if (cancelledRef.current) return;

        let hash = null;
        try {
          hash = await chunkUploadService.calculateSHA256(chunk.blob);
        } catch {
          // hash not supported in all environments, skip validation
        }

        await chunkUploadService.uploadChunk(uploadId, chunk.index, chunk.blob, hash);

        const received = chunks.filter((c) => c.index <= chunk.index).length;
        const percent = Math.round((received / totalChunks) * 100);
        setProgress(Math.min(percent, 99));
        setChunkProgress({ current: chunk.index + 1, total: totalChunks });
      }

      if (cancelledRef.current) return;

      setStep("finalising");
      setProgress(99);

      const completeData = await chunkUploadService.completeUpload(uploadId);
      setProgress(100);
      setStep("done");
      setResult(completeData);

      if (onSuccess) {
        setTimeout(() => onSuccess(completeData), 500);
      }
    } catch (err) {
      if (cancelledRef.current) return;
      setError(err.response?.data?.message || err.message || "Upload failed");
      setStep("error");
    }
  }, [file, onSuccess]);

  const handleCancel = () => {
    cancelledRef.current = true;
    onClose();
  };

  const handleRetry = () => {
    setError("");
    setProgress(0);
    setStep("preparing");
    cancelledRef.current = false;
    upload();
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}>
      <div className="modal-container chunked-upload-modal">
        <div className="modal-header">
          <div>
            <p className="modal-label">Chunked Upload</p>
            <h3>{file?.name || "Large File"}</h3>
          </div>
          <button type="button" className="icon-button" onClick={handleCancel} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {step === "error" && (
            <div className="feedback-banner feedback-error">{error}</div>
          )}

          {step === "done" && result ? (
            <div className="upload-success-section">
              <div className="upload-complete-icon">&#10003;</div>
              <p className="upload-success-msg">Upload completed successfully</p>
              <div className="upload-result-details">
                <div><span>File</span><strong>{result.originalName}</strong></div>
                <div><span>Size</span><strong>{(result.fileSize / (1024 * 1024)).toFixed(1)} MB</strong></div>
                <div><span>Chunks</span><strong>{result.totalChunks}</strong></div>
                <div><span>Primary Node</span><strong>{result.primaryNode}</strong></div>
              </div>
            </div>
          ) : (
            <>
              <div className="chunked-upload-info">
                <div className="info-row">
                  <span>File size</span>
                  <strong>{(file.size / (1024 * 1024)).toFixed(1)} MB</strong>
                </div>
                <div className="info-row">
                  <span>Chunk size</span>
                  <strong>{CHUNK_SIZE_MB} MB</strong>
                </div>
                <div className="info-row">
                  <span>Total chunks</span>
                  <strong>{chunkProgress.total || "—"}</strong>
                </div>
                <div className="info-row">
                  <span>Status</span>
                  <strong className="status-badge">{step}</strong>
                </div>
              </div>

              {(step === "uploading" || step === "finalising") && (
                <div className="chunk-progress-section">
                  <div className="progress-bar-track chunk-progress-track">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="chunk-progress-text">
                    {step === "finalising"
                      ? "Reassembling file..."
                      : `Uploading chunk ${chunkProgress.current} of ${chunkProgress.total}`}
                  </div>
                  <div className="chunk-progress-pct">{progress}%</div>
                </div>
              )}

              {step === "preparing" && (
                <button type="button" className="btn btn-primary upload-start-btn" onClick={upload}>
                  Start Upload
                </button>
              )}
            </>
          )}

          <div className="modal-actions">
            {step === "error" && (
              <>
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleRetry}>
                  Retry
                </button>
              </>
            )}
            {step === "done" && (
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChunkedUploadModal;
