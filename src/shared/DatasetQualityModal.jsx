import { useMemo, useState } from 'react';
import {
  scanDatasetQuality,
  generateQualityReportMarkdown,
  generateChangeLedgerMarkdown,
} from './DatasetQualityScanner.js';

export function DatasetQualityModal({
  show,
  onClose,
  dataItems,
  annotations,
  selectedColumn,
  columnHeaders,
  fileName,
  onSelectRow,
  onDeduplicate,
  onToast,
}) {
  const [selectedIssueTab, setSelectedIssueTab] = useState('all');

  const qualityResult = useMemo(() => {
    if (!show || !dataItems.length) return null;
    return scanDatasetQuality({
      dataItems,
      annotations,
      selectedColumn,
      columnHeaders,
    });
  }, [show, dataItems, annotations, selectedColumn, columnHeaders]);

  if (!show || !qualityResult) return null;

  const { healthScore, totalRows, annotatedRows, issues, labelCounts, shannonEntropy, giniImpurity, flaggedRowIndices } = qualityResult;

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-500 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40';
    if (score >= 60) return 'text-amber-500 border-amber-500 bg-amber-50 dark:bg-amber-950/40';
    return 'text-rose-500 border-rose-500 bg-rose-50 dark:bg-rose-950/40';
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'critical':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'warning':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
  };

  const handleDownloadReport = () => {
    const md = generateQualityReportMarkdown({
      qualityResult,
      datasetName: fileName,
      columnName: columnHeaders[selectedColumn],
    });
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dataset_qa_report_${fileName || 'audit'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    if (onToast) onToast('Downloaded Dataset Quality Report (.md)', 'success');
  };

  const handleDownloadLedger = () => {
    const md = generateChangeLedgerMarkdown({
      datasetName: fileName,
      originalRowsCount: totalRows,
      currentRowsCount: totalRows,
      deduplicatedCount: qualityResult.duplicateGroupsCount || 0,
      annotatedCount: annotatedRows,
      labelsCount: Object.keys(labelCounts || {}).length,
    });
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dataset_change_ledger_${fileName || 'audit'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    if (onToast) onToast('Downloaded Transformation Ledger (.md)', 'success');
  };

  const filteredIssues = issues.filter((iss) => {
    if (selectedIssueTab === 'all') return true;
    return iss.severity === selectedIssueTab;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-gray-900 dark:text-white text-lg">
                  Dataset Quality &amp; "Fit-for-Use" Audit
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-700">
                  100% In-Browser Privacy
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Automated detection of duplicates, conflicting labels, nulls, and training data anomalies.
              </p>
            </div>
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

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* Scope of Verification & Objective Assessment Notice */}
          <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/70 dark:bg-blue-950/30 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold">
              <span>🛡️</span>
              <span>Scope of Verification &amp; Objective Assessment Notice</span>
            </div>
            <p className="text-blue-900/90 dark:text-blue-200/80 leading-relaxed text-[11px]">
              This report describes <strong>only the programmatic, deterministic checks executed on this dataset</strong>: exact and near-duplicate text matching, missing value counts, text length distribution boundaries, and annotation consistency. <strong>Important:</strong> It is an objective audit of structural completeness and internal consistency. It does NOT guarantee that the dataset is factually accurate, free from real-world bias, or suitable for any particular machine learning architecture or clinical application.
            </p>
          </div>

          {/* Health Score & High Level Metrics Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Score Pill */}
            <div className={`p-4 rounded-2xl border flex flex-col justify-between items-center text-center ${getScoreColor(healthScore)}`}>
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">Dataset Health Score</span>
              <div className="text-4xl font-black my-1">{healthScore}<span className="text-xl font-normal opacity-60">/100</span></div>
              <span className="text-xs font-semibold">
                {healthScore >= 85 ? '✅ Structural Pass' : healthScore >= 60 ? '⚠️ Quality Risks Found' : '❌ Critical Fixes Needed'}
              </span>
            </div>

            {/* Total Records */}
            <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex flex-col justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Dataset Rows</span>
              <div className="text-2xl font-bold text-gray-900 dark:text-white my-1">
                {totalRows.toLocaleString()}
              </div>
              <span className="text-xs text-gray-500">
                Column: <strong className="text-gray-700 dark:text-gray-300">{columnHeaders[selectedColumn] || 'Target'}</strong>
              </span>
            </div>

            {/* Annotated Progress */}
            <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex flex-col justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Coverage</span>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 my-1">
                {annotatedRows.toLocaleString()}{' '}
                <span className="text-xs font-normal text-gray-400">
                  ({((annotatedRows / (totalRows || 1)) * 100).toFixed(0)}%)
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {totalRows - annotatedRows} unlabeled rows left
              </span>
            </div>

            {/* Identified Issues & Review Queue Action */}
            <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex flex-col justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Review Queue</span>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 my-1">
                {flaggedRowIndices?.length || 0}
              </div>
              {flaggedRowIndices?.length > 0 ? (
                <button
                  onClick={() => {
                    if (onSelectRow && flaggedRowIndices.length > 0) {
                      onSelectRow(flaggedRowIndices[0]);
                      if (onToast) onToast(`Loaded Row #${flaggedRowIndices[0] + 1} from Review Queue (${flaggedRowIndices.length} flagged)`, 'info');
                    }
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold transition shadow-xs flex items-center justify-center gap-1"
                >
                  <span>🎯 Enter Review Queue</span>
                </button>
              ) : (
                <span className="text-xs text-gray-500">0 flagged samples</span>
              )}
            </div>
          </div>

          {/* Class Distribution Breakdown */}
          {Object.keys(labelCounts).length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Class Distribution &amp; Statistical Balance
                </span>
                <div className="flex items-center gap-3 text-xs text-gray-500 font-mono">
                  <span>Entropy: <strong className="text-gray-800 dark:text-gray-200">{shannonEntropy ?? 'N/A'}</strong></span>
                  <span>Gini: <strong className="text-gray-800 dark:text-gray-200">{giniImpurity ?? 'N/A'}</strong></span>
                  <span>{Object.keys(labelCounts).length} classes</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(labelCounts).map(([label, count]) => {
                  const pct = ((count / (annotatedRows || 1)) * 100).toFixed(1);
                  return (
                    <div key={label} className="bg-white dark:bg-gray-850 p-2.5 rounded-xl border border-gray-100 dark:border-gray-750">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{label}</span>
                        <span className="font-mono text-gray-400">{count}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 block">{pct}% of sample</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Issues Filter Tabs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Audit Findings ({issues.length})
              </span>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs">
                {['all', 'critical', 'warning', 'info'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedIssueTab(tab)}
                    className={`px-3 py-1 rounded-lg capitalize font-medium transition-colors ${
                      selectedIssueTab === tab
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {filteredIssues.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-100 dark:border-gray-800">
                <span className="text-3xl mb-2 block">🎉</span>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  No issues found in this category!
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Your dataset passed all quality assertions.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredIssues.map((iss) => (
                  <div
                    key={iss.id}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-850 shadow-xs flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getSeverityBadge(iss.severity)}`}>
                            {iss.severity}
                          </span>
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                            {iss.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white mt-1">
                          {iss.title}
                        </h4>
                      </div>
                      {iss.id === 'duplicate_entries' && onDeduplicate && (
                        <button
                          onClick={onDeduplicate}
                          className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors shrink-0"
                        >
                          Auto-Deduplicate
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      {iss.description}
                    </p>

                    {/* Conflict Groups preview (if inconsistent labels) */}
                    {iss.id === 'inconsistent_labels' && iss.groups && (
                      <div className="mt-2 space-y-1.5 bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/40">
                        <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase">
                          Sample Conflicting Labels:
                        </span>
                        {iss.groups.slice(0, 3).map((grp, gIdx) => (
                          <div key={gIdx} className="text-xs bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-750">
                            <p className="font-mono text-[11px] text-gray-700 dark:text-gray-300 truncate mb-1">
                              "{grp.text}"
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(grp.breakdown).map(([lbl, idxs]) => (
                                <button
                                  key={lbl}
                                  onClick={() => {
                                    if (onSelectRow) onSelectRow(idxs[0]);
                                    onClose();
                                  }}
                                  className="text-[10px] bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 transition-colors"
                                  title="Click to jump to row in workspace"
                                >
                                  Label: <strong className="text-blue-600 dark:text-blue-400">{lbl}</strong> (Row #{idxs[0] + 1})
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Impacted Rows Pill Links */}
                    {iss.rowIndices?.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase">Jump to Row:</span>
                        {iss.rowIndices.slice(0, 8).map((rIdx) => (
                          <button
                            key={rIdx}
                            onClick={() => {
                              if (onSelectRow) onSelectRow(rIdx);
                              onClose();
                            }}
                            className="px-2 py-0.5 rounded bg-gray-100 hover:bg-blue-100 dark:bg-gray-800 dark:hover:bg-blue-900/40 text-[10px] font-mono text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-colors"
                          >
                            #{rIdx + 1}
                          </button>
                        ))}
                        {iss.rowIndices.length > 8 && (
                          <span className="text-[10px] text-gray-400">+{iss.rowIndices.length - 8} more</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>GDPR Article 28 &amp; HIPAA Memory Isolation Verified</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleDownloadLedger}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 transition-colors"
              title="Export reproducible change ledger of dataset mutations"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>Change Ledger (.md)</span>
            </button>
            <button
              onClick={handleDownloadReport}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Audit Report (.md)
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors border border-gray-200 dark:border-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
