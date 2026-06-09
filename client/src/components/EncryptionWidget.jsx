import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { APP_PATHS } from "../routes/appRoutes.js";
import { Shield, ArrowRight } from "lucide-react";

const EncryptionWidget = React.memo(({ encryptionStatus }) => {
  const navigate = useNavigate();
  const { enabled = false, algorithm = "aes-256-gcm", keyVersion = null, encryptedFileCount = 0, totalFileCount = 0, encryptionRate = 0 } = encryptionStatus || {};
  const label = (algorithm || "aes-256-gcm").toUpperCase().replace(/-/g, "-");

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.3, ease: "easeOut" }}
      className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
            <Shield className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-100">Encryption</h3>
            <p className="text-xs text-gray-500">Coverage</p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-100 transition-colors cursor-pointer"
          onClick={() => navigate(APP_PATHS.storageAnalytics)}
        >
          Details
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-col gap-2.5 mb-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Coverage</span>
          <span className="text-xs text-gray-500">({encryptedFileCount} of {totalFileCount} files)</span>
        </div>
        <strong className="text-xl font-semibold text-gray-100">{encryptionRate}%</strong>
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(encryptionRate, 100)}%` }}
            transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
            className="h-full rounded-full bg-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-gray-800 border border-gray-700">
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Encrypted</span>
          <strong className="text-sm font-semibold text-gray-100">{encryptedFileCount}</strong>
        </div>
        <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-gray-800 border border-gray-700">
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Total Files</span>
          <strong className="text-sm font-semibold text-gray-100">{totalFileCount}</strong>
        </div>
        <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-gray-800 border border-gray-700">
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Algorithm</span>
          <strong className="text-sm font-semibold text-gray-100 truncate">{label}</strong>
        </div>
      </div>

      <div className={`mt-3 flex items-center gap-2 px-3.5 py-2.5 rounded-lg border ${enabled ? "bg-emerald-900/30 border-emerald-800/50" : "bg-gray-800 border-gray-700/50"}`}>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${enabled ? "bg-emerald-500" : "bg-gray-600"}`} />
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-gray-100">Encryption: {enabled ? "Active" : "Inactive"}</span>
          {keyVersion != null && <span className="text-xs text-gray-500">Key v{keyVersion}</span>}
        </div>
      </div>
    </motion.section>
  );
});

export default EncryptionWidget;
