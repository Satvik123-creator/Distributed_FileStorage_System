import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const UploadSuccessModal = ({ isOpen, uploadData, onUploadAnother, onGoToMyFiles }) => {
  return (
    <AnimatePresence>
      {isOpen && uploadData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-gray-900 rounded-xl shadow-xl border border-gray-800 w-full max-w-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-success-title"
          >
            <div className="flex items-start justify-between gap-2 p-5 border-b border-gray-800">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">Upload Complete</p>
                <h3 id="upload-success-title" className="text-lg font-bold text-gray-100 mt-0.5">File uploaded successfully</h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-900/30 text-emerald-400 text-xs font-medium whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Success
              </span>
            </div>

            <div className="p-5 grid gap-3">
              <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-gray-800 border border-gray-700">
                <span className="text-xs text-gray-500">File Name</span>
                <strong className="text-sm text-gray-100 truncate">{uploadData.fileName}</strong>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-gray-800 border border-gray-700">
                  <span className="text-xs text-gray-500">Version</span>
                  <strong className="text-sm text-gray-100">v{uploadData.version || 1}</strong>
                </div>
                <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-gray-800 border border-gray-700">
                  <span className="text-xs text-gray-500">Node</span>
                  <strong className="text-sm text-gray-100 truncate">{uploadData.primaryNode || uploadData.nodeLocation || "Not provided"}</strong>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-gray-800 border border-gray-700">
                <span className="text-xs text-gray-500">Upload Time</span>
                <strong className="text-sm text-gray-100">{uploadData.uploadTime}</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 pt-0">
              <button
                type="button"
                className="px-4 py-2.5 border border-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={onUploadAnother}
              >
                Upload Another File
              </button>
              <button
                type="button"
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
                onClick={onGoToMyFiles}
              >
                Go To My Files
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadSuccessModal;
