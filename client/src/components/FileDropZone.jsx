import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { CloudUpload } from "lucide-react";

const FileDropZone = ({ onFileSelect, selectedFile, disabled }) => {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const openFilePicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleFiles = (fileList) => {
    const file = fileList?.[0];
    if (file) onFileSelect(file);
  };

  const onInputChange = (event) => {
    handleFiles(event.target.files);
    event.target.value = "";
  };

  const onDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(event.dataTransfer.files);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
       className={`relative flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed rounded-xl cursor-pointer transition-all text-center ${
         isDragging && !disabled
           ? "border-gray-100 bg-gray-800"
           : selectedFile
             ? "border-emerald-700 bg-emerald-900/20"
             : "border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800"
       } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      role="button"
      tabIndex={0}
      onClick={openFilePicker}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openFilePicker();
        }
      }}
      onDragEnter={(event) => { event.preventDefault(); if (!disabled) setIsDragging(true); }}
      onDragOver={(event) => { event.preventDefault(); if (!disabled) setIsDragging(true); }}
      onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }}
      onDrop={onDrop}
      aria-label="Upload file drop zone"
    >
      <input ref={inputRef} type="file" className="sr-only" onChange={onInputChange} disabled={disabled} />

      <motion.div
        animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
          isDragging ? "bg-gray-100" : "bg-gray-800"
        }`}
      >
        <CloudUpload className={`w-7 h-7 ${isDragging ? "text-gray-900" : "text-gray-400"}`} />
      </motion.div>

      <h3 className="text-base font-semibold text-gray-100">
        {isDragging ? "Drop your file here" : "Drag and drop your file here"}
      </h3>
      <p className="text-sm text-gray-500">or click to browse files from your device</p>
      <span className="text-xs text-gray-500">Supported for secure storage upload</span>

      {selectedFile && (
        <div className="flex items-center gap-2 mt-2 text-sm">
          <strong className="text-gray-100">Selected:</strong>
          <span className="text-gray-400">{selectedFile.name}</span>
        </div>
      )}
    </motion.div>
  );
};

export default FileDropZone;
