import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  File,
  HardDrive,
  Layers,
  Lock,
  Server,
  Pause,
  Play,
  RotateCcw,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Upload,
} from "lucide-react";
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
      }
    }
    if (onCancel) onCancel();
  };

  const totalChunks = chunks.length;
  const doneCount = countStatus("done");
  const failedCount = countStatus("failed");

  const isUploading = step === "uploading";
  const isPaused = step === "paused";
  const isError = step === "error";
  const isDone = step === "done";
  const isFinalizing = step === "finalizing";
  const isPreparing = step === "preparing";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-gray-800 bg-gray-900 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0">
            <File className="w-5 h-5 text-gray-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">Chunked Upload</p>
            <h3 className="text-base font-bold text-gray-100 truncate">{file?.name || "Large File"}</h3>
          </div>
        </div>
        {!isUploading && !isPreparing && (
          <button type="button" className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer flex-shrink-0" onClick={handleCancel} aria-label="Cancel">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && <div className="mx-4 mt-3 px-3 py-2 rounded-lg text-xs bg-red-900/30 text-red-400 border border-red-800">{error}</div>}

      {/* Info grid */}
      <div className="p-4 pb-2 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-800 border border-gray-700">
          <HardDrive className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">File Size</p>
            <p className="text-xs font-semibold text-gray-100">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-800 border border-gray-700">
          <Layers className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Chunk Size</p>
            <p className="text-xs font-semibold text-gray-100">{CHUNK_SIZE_MB} MB</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-800 border border-gray-700">
          <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Encryption</p>
            <p className="text-xs font-semibold text-emerald-400">AES-256-GCM</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-800 border border-gray-700">
          <Server className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Replication</p>
            <p className="text-xs font-semibold text-gray-300">On write</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      {step !== "idle" && totalChunks > 0 && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-100" />}
              {isPaused && <Pause className="w-3.5 h-3.5 text-gray-400" />}
              {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              {isError && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
              {isPreparing ? "Preparing..." :
               isFinalizing ? "Finalizing..." :
               isDone ? "Upload complete" :
               isPaused ? `Paused at chunk ${currentChunk}/${totalChunks}` :
               isError ? "Upload failed" :
               `Uploading chunk ${currentChunk} of ${totalChunks}`}
            </div>
            <span className="text-sm font-semibold text-gray-100">{overallProgress}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`h-full rounded-full ${isDone ? "bg-emerald-500" : isError ? "bg-red-500" : "bg-gray-100"}`}
            />
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
            <span>Chunk {currentChunk} / {totalChunks}</span>
            {totalChunks > 0 && (
              <>
                <span>·</span>
                <span>{doneCount} / {totalChunks} done</span>
              </>
            )}
            {failedCount > 0 && (
              <span className="text-red-400">({failedCount} failed)</span>
            )}
          </div>
        </div>
      )}

      {/* Chunk grid */}
      {totalChunks > 0 && (
        <div className="px-4 pb-3">
          <div className="grid grid-cols-10 sm:grid-cols-16 gap-1">
            {chunks.map((c, i) => (
              <div
                key={i}
                className={`aspect-square rounded-md flex items-center justify-center text-[9px] font-medium transition-colors ${
                  c.status === "done" ? "bg-emerald-900/40 text-emerald-400" :
                  c.status === "uploading" ? "bg-blue-900/40 text-blue-400" :
                  c.status === "failed" ? "bg-red-900/40 text-red-400" :
                  "bg-gray-800 text-gray-500"
                }`}
                title={`Chunk ${i + 1}: ${c.status}`}
              >
                {c.status === "done" ? <CheckCircle2 className="w-3 h-3" /> :
                 c.status === "uploading" ? <Loader2 className="w-3 h-3 animate-spin" /> :
                 c.status === "failed" ? <AlertCircle className="w-3 h-3" /> :
                 i + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 pb-4">
        {step === "idle" && (
          <button
            type="button"
            onClick={startUpload}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Start Upload
          </button>
        )}
        {isUploading && (
          <button
            type="button"
            onClick={handlePause}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <Pause className="w-4 h-4" />
            Pause
          </button>
        )}
        {isPaused && (
          <button
            type="button"
            onClick={handleResume}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4" />
            Resume
          </button>
        )}
        {isError && failedCount > 0 && (
          <>
            <button
              type="button"
              onClick={handleRetryFailed}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Retry {failedCount > 1 ? `(${failedCount})` : "Failed"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-red-400 text-sm font-medium rounded-lg hover:bg-red-900/30 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </>
        )}
        {(isDone || isFinalizing) && (
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isDone ? "Done" : "Close"}
          </button>
        )}
      </div>

      {/* Legend */}
      {totalChunks > 0 && (
        <div className="flex items-center gap-3 px-4 pb-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Done</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-100 inline-block" /> Uploading</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-600 inline-block" /> Pending</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Failed</span>
        </div>
      )}
    </motion.div>
  );
};

export default ChunkedUploadManager;
