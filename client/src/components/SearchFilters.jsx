import React from "react";

const mimeTypeOptions = [
  { label: "All File Types", value: "" },
  { label: "PDF", value: "application/pdf" },
  { label: "Word Document", value: "application/msword" },
  {
    label: "Word Document (DOCX)",
    value:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  { label: "Excel Spreadsheet", value: "application/vnd.ms-excel" },
  { label: "PNG Image", value: "image/png" },
  { label: "JPEG Image", value: "image/jpeg" },
  { label: "Text", value: "text/plain" },
];

const SearchFilters = ({ filters, onChange }) => {
  return (
    <section className="search-filters-card">
      <div className="search-filter-grid">
        <label className="search-filter-field">
          <span>File Type</span>
          <select
            value={filters.mimeType}
            onChange={(event) => onChange("mimeType", event.target.value)}
          >
            {mimeTypeOptions.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="search-filter-field">
          <span>Start Date</span>
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) => onChange("startDate", event.target.value)}
          />
        </label>

        <label className="search-filter-field">
          <span>End Date</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(event) => onChange("endDate", event.target.value)}
          />
        </label>
      </div>
    </section>
  );
};

export default SearchFilters;
