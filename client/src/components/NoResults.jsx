import React from "react";

const NoResults = ({
  title = "No Results",
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12 border border-gray-800 rounded-xl bg-gray-900 shadow-sm text-center">
      <div className="text-4xl">🔎</div>
      <h3 className="text-lg font-bold text-gray-100">{title}</h3>
      <p className="text-sm text-gray-400 max-w-md">
        {message ||
          "No matching files found. Try changing your filters or search terms."}
      </p>
      {actionLabel && onAction && (
        <button type="button" className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition cursor-pointer" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default NoResults;
