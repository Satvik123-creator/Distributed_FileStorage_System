import React from "react";

const SearchBar = ({ value, onChange, onSearch, onReset, loading }) => {
  return (
    <div className="search-bar-card">
      <div className="search-bar-row">
        <label className="search-bar-label" htmlFor="search-filename">
          Search by File Name
        </label>
        <div className="search-bar-controls">
          <input
            id="search-filename"
            type="text"
            className="search-input"
            placeholder="Type a filename, e.g. resume"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            autoComplete="off"
          />
          <button
            type="button"
            className="file-action-button file-action-primary"
            onClick={onSearch}
            disabled={loading}
          >
            {loading ? "Searching..." : "Search"}
          </button>
          <button
            type="button"
            className="file-action-button modal-cancel-button"
            onClick={onReset}
            disabled={loading}
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
