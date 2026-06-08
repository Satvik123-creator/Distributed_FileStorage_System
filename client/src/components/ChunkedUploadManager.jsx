import React, { useEffect, useRef, useState } from "react";
import chunkUploadService from "../services/chunkUploadService.js";

const CHUNK_SIZE_MB = 5;

const ChunkedUploadManager = ({ file, onSuccess, onCancel }) => {
  const [chunks, setChunks] = useState([]);
  const [uploadId, setUploadId] = useState(null);
  const [step, setStep] = useState("idle");
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const pausedRef = useRef(false);
  const mountedRef = useRef(true);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const updateChunks = (index, status) => {
    setChunks((prev) => prev.map((c, i) => (i === index ? { ...c, status } : c)));
  };

  const countStatus = (status) => {
    let count = 0;
    for (const c of chunks) {
      if (c.status === status) count++;
    }
    return count;
  };

  const uploadLoop = async (id, chunkList) => {
    for (let i = 0; i < chunkList.length; i++) {
      if (!mountedRef.current) return;
      if (pausedRef.current) {
        setStep("paused");
        return;
      }

      const st = chunks[i]?.status;
      if (st === "done") continue;

      setCurrentChunk(i + 1);
      setStep("uploading");
      updateChunks(i, "uploading");

      try {
        let hash = null;
        try {
          hash = await chunkUploadService.calculateSHA256(chunkList[i].blob);
        } catch {
          // hash not supported
        }

        await chunkUploadService.uploadChunk(id, i, chunkList[i].blob, hash);
        if (!mountedRef.current) return;

        updateChunks(i, "done");
        const doneCount = countStatus("done") + 1;
        setOverallProgress(Math.min(Math.round((doneCount / chunkList.length) * 100), 99));
      } catch (err) {
        if (!mountedRef.current) return;
        updateChunks(i, "failed");
        setError(`Chunk ${i + 1}/${chunkList.length} failed: ${err.response?.data?.message || err.message}`);
        setStep("error");
        return;
      }
    }

    if (!mountedRef.current || pausedRef.current) return;

    setStep("finalizing");
    try {
      const completeData = await chunkUploadService.completeUpload(id);
      if (!mountedRef.current) return;
      setStep("done");
      setOverallProgress(100);
      setResult(completeData);
      if (onSuccessRef.current) onSuccessRef.current(completeData);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.response?.data?.message || err.message || "Failed to complete upload");
      setStep("error");
    }
  };

  const startUpload = async () => {
    setStep("preparing");
    setError("");

    try {
      const chunkList = chunkUploadService.splitFileIntoChunks(file);
      setChunks(chunkList.map((c) => ({ ...c, status: "pending" })));
      setCurrentChunk(0);

      const initData = await chunkUploadService.initUpload(file);
      const id = initData.uploadId;
      setUploadId(id);

      if (!mountedRef.current) return;
      setStep("uploading");

      // Wait for state to settle before starting loop
      setTimeout(() => {
        if (mountedRef.current && !pausedRef.current) {
          setChunks((current) => {
            uploadLoop(id, current.length > 0 ? current : chunkList);
            return current;
          });
        }
      }, 0);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.response?.data?.message || err.message || "Failed to initialize upload");
      setStep("error");
    }
  };

  const handlePause = () => {
    pausedRef.current = true;
    setStep("paused");
  };

  const handleResume = () => {
    pausedRef.current = false;
    setStep("uploading");
    if (uploadId) {
      setChunks((current) => {
        setTimeout(() => {
          if (mountedRef.current && !pausedRef.current) {
            uploadLoop(uploadId, current);
          }
        }, 0);
        return current;
      });
    }
  };

  const handleRetryFailed = () => {
    const hasFailed = chunks.some((c) => c.status === "failed");
    if (!hasFailed) return;

    setError("");
    setChunks((prev) => {
      const updated = prev.map((c) =>
        c.status === "failed" ? { ...c, status: "pending" } : c,
      );
      pausedRef.current = false;
      setStep("uploading");
      if (uploadId) {
        setTimeout(() => {
          if (mountedRef.current && !pausedRef.current) {
            uploadLoop(uploadId, updated);
          }
        }, 0);
      }
      return updated;
    });
  };

  const handleCancel = async () => {
    pausedRef.current = true;
    if (uploadId) {
      try {
        await chunkUploadService.cancelUpload(uploadId);
      } catch {
        // best effort
      }
    }
    if (onCancel) onCancel();
  };

  const renderChunkDots = () => {
    if (chunks.length === 0) return null;
    return (
      <div className="chunk-dots-track">
        {chunks.map((c, i) => (
          <span
            key={i}
            className={`chunk-dot chunk-dot-${c.status}`}
            title={`Chunk ${i + 1}: ${c.status}`}
          />
        ))}
      </div>
    );
  };

  const doneCount = countStatus("done");
  const failedCount = countStatus("failed");
  const totalChunks = chunks.length;

  return (
    <div className="chunked-upload-manager">
      <div className="chunked-upload-header">
        <div>
          <p className="section-label">Chunked Upload</p>
          <h3>{file?.name || "Large File"}</h3>
        </div>
        {step !== "uploading" && step !== "preparing" && (
          <button type="button" className="icon-button" onClick={handleCancel} aria-label="Cancel">
            ✕
          </button>
        )}
      </div>

      {error && <div className="feedback-banner feedback-error">{error}</div>}

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
          <strong>{totalChunks || "—"}</strong>
        </div>
        <div className="info-row">
          <span>Status</span>
          <strong className="status-badge">{step}</strong>
        </div>
      </div>

      {step !== "idle" && totalChunks > 0 && (
        <>
          <div className="chunk-progress-section">
            <div className="progress-bar-track chunk-progress-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <div className="chunk-progress-text">
              {step === "finalizing"
                ? "Reassembling file..."
                : step === "done"
                  ? "Upload complete"
                  : `Uploading chunk ${currentChunk} of ${totalChunks}`}
            </div>
            <div className="chunk-progress-pct">{overallProgress}%</div>
          </div>

          <div className="chunk-progress-detailed">
            <span>Chunk {currentChunk} / {totalChunks}</span>
            <div className="chunk-done-indicator">
              <span className="done-count">{doneCount}</span>
              <span className="done-sep">/</span>
              <span className="total-count">{totalChunks}</span>
              {failedCount > 0 && (
                <span className="failed-count">({failedCount} failed)</span>
              )}
            </div>
          </div>

          {renderChunkDots()}
        </>
      )}

      {step === "idle" && (
        <button
          type="button"
          className="btn btn-primary upload-start-btn"
          onClick={startUpload}
        >
          Start Upload
        </button>
      )}

      <div className="chunked-upload-actions">
        {step === "uploading" && (
          <button
            type="button"
            className="file-action-button file-action-secondary"
            onClick={handlePause}
          >
            Pause
          </button>
        )}
        {step === "paused" && (
          <button
            type="button"
            className="file-action-button file-action-primary"
            onClick={handleResume}
          >
            Resume
          </button>
        )}
        {step === "error" && failedCount > 0 && (
          <>
            <button
              type="button"
              className="file-action-button file-action-primary"
              onClick={handleRetryFailed}
            >
              Retry Failed {failedCount > 1 ? `(${failedCount})` : "Chunk"}
            </button>
            <button
              type="button"
              className="file-action-button file-action-danger"
              onClick={handleCancel}
            >
              Cancel Upload
            </button>
          </>
        )}
        {(step === "done" || step === "finalizing") && (
          <button
            type="button"
            className="file-action-button file-action-primary"
            onClick={handleCancel}
          >
            {step === "done" ? "Done" : "Close"}
          </button>
        )}
      </div>

      <div className="chunk-legend">
        <span className="chunk-legend-item">
          <span className="chunk-dot chunk-dot-done" /> Done
        </span>
        <span className="chunk-legend-item">
          <span className="chunk-dot chunk-dot-uploading" /> Uploading
        </span>
        <span className="chunk-legend-item">
          <span className="chunk-dot chunk-dot-pending" /> Pending
        </span>
        <span className="chunk-legend-item">
          <span className="chunk-dot chunk-dot-failed" /> Failed
        </span>
      </div>
    </div>
  );
};

export default ChunkedUploadManager;
