import { useState, useMemo } from 'react';
import { EXPORT_FORMATS, formatDataset } from './exportFormats.js';

export function ExportModal({
  show,
  onClose,
  dataItems,
  annotations,
  selectedColumn,
  columnHeaders,
  labelsList,
  fileName,
  onToast,
}) {
  const [selectedFormatId, setSelectedFormatId] = useState('openai_chat');
  const [instruction, setInstruction] = useState(
    EXPORT_FORMATS.find((f) => f.id === 'openai_chat')?.defaultInstruction || ''
  );
  const [includeAllCols, setIncludeAllCols] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentFormat = useMemo(
    () => EXPORT_FORMATS.find((f) => f.id === selectedFormatId) || EXPORT_FORMATS[0],
    [selectedFormatId]
  );

  const totalAnnotated = useMemo(
    () => annotations.filter(Boolean).length,
    [annotations]
  );

  const generatedContent = useMemo(() => {
    if (!show || !totalAnnotated) return '';
    return formatDataset({
      formatId: selectedFormatId,
      dataItems,
      annotations,
      selectedColumn,
      columnHeaders,
      instruction,
      includeAllOriginalColumns: includeAllCols,
      labelsList,
    });
  }, [
    show,
    selectedFormatId,
    dataItems,
    annotations,
    selectedColumn,
    columnHeaders,
    instruction,
    includeAllCols,
    labelsList,
    totalAnnotated,
  ]);

  const previewSnippet = useMemo(() => {
    if (!generatedContent) return 'No annotations available to export.';
    const lines = generatedContent.split('\n');
    return lines.slice(0, 12).join('\n') + (lines.length > 12 ? '\n... (truncated)' : '');
  }, [generatedContent]);

  if (!show) return null;

  const handleDownload = () => {
    if (!generatedContent) return;
    const blob = new Blob([generatedContent], { type: currentFormat.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const baseName = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'dataset';
    a.href = url;
    a.download = `${baseName}_${currentFormat.id}.${currentFormat.ext}`;
    a.click();
    URL.revokeObjectURL(url);
    if (onToast) onToast(`Exported ${totalAnnotated} rows as ${currentFormat.name}!`, 'success');
  };

  const handleCopy = async () => {
    if (!generatedContent) return;
    try {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onToast) onToast('Copied to clipboard!', 'success');
    } catch {
      if (onToast) onToast('Failed to copy to clipboard', 'error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">
                Export Annotated Dataset
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                {totalAnnotated} items
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              One-click LLM fine-tuning datasets, machine learning formats, and raw tabular data.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Format Selection Grid */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
              Select Target Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {EXPORT_FORMATS.map((fmt) => {
                const isSelected = fmt.id === selectedFormatId;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => {
                      setSelectedFormatId(fmt.id);
                      if (fmt.hasInstruction && !instruction) {
                        setInstruction(fmt.defaultInstruction);
                      }
                    }}
                    className={`text-left p-3 rounded-xl border transition-all text-sm flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-500 shadow-sm ring-1 ring-blue-500'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-850'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white truncate">
                          {fmt.name}
                        </span>
                      </div>
                      <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded ${fmt.badgeColor} mb-1.5`}>
                        {fmt.badge}
                      </span>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {fmt.description}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono mt-2 self-end">
                      .{fmt.ext}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Options */}
          {currentFormat.hasInstruction && (
            <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                System Instruction / Task Prompt
              </label>
              <textarea
                rows={2}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="e.g. You are a classification assistant..."
                className="w-full text-xs p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                This prompt will be embedded into each sample's system/instruction field.
              </p>
            </div>
          )}

          {(currentFormat.id === 'standard_csv' || currentFormat.id === 'standard_json') && (
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={includeAllCols}
                onChange={(e) => setIncludeAllCols(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Include all original CSV columns in the export (not just the target column)</span>
            </label>
          )}

          {/* Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Output Preview ({currentFormat.ext.toUpperCase()})
              </span>
              <span className="text-[11px] text-gray-400">
                First rows shown below
              </span>
            </div>
            <div className="bg-gray-950 text-gray-200 p-3.5 rounded-xl text-xs font-mono overflow-x-auto max-h-48 border border-gray-800 leading-relaxed shadow-inner">
              <pre>{previewSnippet}</pre>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!totalAnnotated}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy to Clipboard
              </>
            )}
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!totalAnnotated}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-40"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download {currentFormat.name} (.{currentFormat.ext})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
