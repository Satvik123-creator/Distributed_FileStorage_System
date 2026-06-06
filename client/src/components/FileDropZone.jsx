import React, { useRef, useState } from "react";

const FileDropZone = ({ onFileSelect, selectedFile, disabled }) => {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const openFilePicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleFiles = (fileList) => {
    const file = fileList?.[0];
    if (file) {
      onFileSelect(file);
    }
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
    <div
      className={`drop-zone ${isDragging ? "drop-zone-active" : ""} ${disabled ? "drop-zone-disabled" : ""}`}
      role="button"
      tabIndex={0}
      onClick={openFilePicker}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openFilePicker();
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDragging(false);
      }}
      onDrop={onDrop}
      aria-label="Upload file drop zone"
    >
      <input
        ref={inputRef}
        type="file"
        className="visually-hidden"
        onChange={onInputChange}
        disabled={disabled}
      />
      <div className="drop-zone-icon">☁</div>
      <h3>Drag and drop your file here</h3>
      <p>or click to browse files from your device</p>
      <span className="drop-zone-support">
        Supported for secure storage upload
      </span>

      {selectedFile && (
        <div className="drop-zone-footer">
          <strong>Selected:</strong>
          <span>{selectedFile.name}</span>
        </div>
      )}
    </div>
  );
};

export default FileDropZone;
