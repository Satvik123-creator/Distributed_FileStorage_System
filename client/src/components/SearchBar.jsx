import React from "react";

const SearchBar = ({ value, onChange, onSearch, onReset, loading }) => {
  return (
    <div className="p-5 border border-gray-800 rounded-xl bg-gray-900 shadow-sm">
      <div className="flex items-end gap-3">
        <label className="flex flex-col gap-1.5 flex-1" htmlFor="search-filename">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-400">Search by File Name</span>
          <div className="flex items-center gap-2">
            <input
              id="search-filename"
              type="text"
              className="flex-1 px-3.5 py-2.5 border border-gray-700 rounded-xl bg-gray-800 text-gray-100 placeholder-gray-500 text-sm outline-none focus:border-gray-500 transition"
              placeholder="Type a filename, e.g. resume"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              autoComplete="off"
            />
            <button
              type="button"
              className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition cursor-pointer disabled:opacity-50"
              onClick={onSearch}
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </button>
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-800 text-gray-400 hover:bg-gray-700 transition cursor-pointer disabled:opacity-50"
              onClick={onReset}
              disabled={loading}
            >
              Reset Filters
            </button>
          </div>
        </label>
      </div>
    </div>
  );
};

export default SearchBar;
