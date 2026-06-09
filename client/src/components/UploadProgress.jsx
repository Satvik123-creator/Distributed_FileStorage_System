import React from "react";
import { motion } from "framer-motion";
import { Lock, Server, Loader2, CheckCircle2, XCircle } from "lucide-react";

const UploadProgress = ({ status, progress }) => {
  const percent = Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : 0;

  const isUploading = status === "Uploading";
  const isDone = status === "Success";
  const isFailed = status === "Failed";

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: 0.1 }}
      className="rounded-xl border border-gray-800 bg-gray-900 p-4 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <strong className="text-sm text-gray-100">{status}</strong>
        <span className="text-sm font-bold text-gray-100">{percent}%</span>
      </div>

      <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-4" aria-label={`Upload progress ${percent}%`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: isUploading ? 0.3 : 0.5, ease: "easeOut" }}
          className={`h-full rounded-full ${isDone ? "bg-emerald-500" : isFailed ? "bg-red-500" : "bg-gray-100"}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-800 border border-gray-700">
          <Lock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Encryption</p>
            <p className="text-xs font-medium text-gray-300 truncate">{isDone ? "AES-256-GCM" : isFailed ? "Failed" : "Active"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-800 border border-gray-700">
          <Server className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Replication</p>
            <p className="text-xs font-medium text-gray-300 truncate">{isDone ? "2x Replicated" : isFailed ? "Failed" : "Pending"}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UploadProgress;
