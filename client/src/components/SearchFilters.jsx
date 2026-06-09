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
    <section className="p-5 border border-gray-800 rounded-xl bg-gray-900 shadow-sm">
      <div className="grid grid-cols-3 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-gray-100">File Type</span>
          <select
            className="w-full px-3.5 py-2.5 border border-gray-700 rounded-xl bg-gray-800 text-gray-100 text-sm outline-none focus:border-gray-500 transition"
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

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-gray-100">Start Date</span>
          <input
            type="date"
            className="w-full px-3.5 py-2.5 border border-gray-700 rounded-xl bg-gray-800 text-gray-100 text-sm outline-none focus:border-gray-500 transition"
            value={filters.startDate}
            onChange={(event) => onChange("startDate", event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-gray-100">End Date</span>
          <input
            type="date"
            className="w-full px-3.5 py-2.5 border border-gray-700 rounded-xl bg-gray-800 text-gray-100 text-sm outline-none focus:border-gray-500 transition"
            value={filters.endDate}
            onChange={(event) => onChange("endDate", event.target.value)}
          />
        </label>
      </div>
    </section>
  );
};

export default SearchFilters;
