import { useRef, useState } from 'react';

/**
 * FileUpload — drag-and-drop + click-to-browse CSV picker.
 */
export function FileUpload({ onFileUpload, accept = '.csv' }) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      inputRef.current.files = e.dataTransfer.files;
      onFileUpload({ target: inputRef.current });
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
        ${dragActive
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      aria-label="Upload CSV file"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onFileUpload}
        className="hidden"
        aria-hidden="true"
      />
      <p className="text-blue-600 dark:text-blue-400 font-medium">
        Drag &amp; drop a CSV file here, or <span className="underline">click to browse</span>
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">UTF-8 encoded CSV files only</p>
    </div>
  );
}

/**
 * FilePreview — collapsible table showing the first 5 rows of a CSV.
 */
export function FilePreview({ columnHeaders, dataItems, showPreview, togglePreview }) {
  if (!dataItems.length) return null;
  const previewRows = dataItems.slice(0, 5);

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Preview — first {previewRows.length} of {dataItems.length} rows
        </h3>
        <button
          onClick={togglePreview}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          aria-expanded={showPreview}
        >
          {showPreview ? 'Hide preview' : 'Show preview'}
        </button>
      </div>
      {showPreview && (
        <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-600">
          <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                {columnHeaders.map((h, i) => (
                  <th key={i} className="px-4 py-2 border-b dark:border-gray-600 truncate max-w-xs font-medium">
                    {h || `Column ${i + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, ri) => (
                <tr key={ri} className="border-b dark:border-gray-600 last:border-0">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-2 truncate max-w-xs" title={cell}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
