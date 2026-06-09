import React from "react";

const DeleteConfirmationModal = ({
  isOpen,
  file,
  onCancel,
  onDelete,
  loading,
}) => {
  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="presentation" onClick={onCancel}>
      <div
        className="bg-gray-900 border border-gray-800 rounded-xl shadow-sm p-6 w-full max-w-md grid gap-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Confirm Delete</p>
            <h3 id="delete-modal-title" className="text-lg font-bold text-gray-100">Delete this file?</h3>
          </div>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-300 transition cursor-pointer text-lg leading-none"
            onClick={onCancel}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-400">
          Are you sure you want to delete this file?
        </p>
        <p className="text-base font-bold text-gray-100">{file.originalName}</p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-800 text-gray-400 hover:bg-gray-700 transition cursor-pointer disabled:opacity-50"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition cursor-pointer disabled:opacity-50"
            onClick={() => onDelete(file)}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
