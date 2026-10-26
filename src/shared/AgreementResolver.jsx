import { useState, useMemo, useRef } from 'react';
import { parseCSV } from './csvParser.js';

/**
 * Calculates Cohen's Kappa Coefficient between two annotators
 * κ = (Po - Pe) / (1 - Pe)
 */
export function calculateCohensKappa(annotatorA, annotatorB, classes) {
  let totalEvaluated = 0;
  let matches = 0;
  const countsA = {};
  const countsB = {};

  classes.forEach((c) => {
    countsA[c] = 0;
    countsB[c] = 0;
  });

  const len = Math.min(annotatorA.length, annotatorB.length);
  for (let i = 0; i < len; i++) {
    const a = annotatorA[i];
    const b = annotatorB[i];
    if (a && b) {
      totalEvaluated++;
      if (a === b) matches++;
      countsA[a] = (countsA[a] || 0) + 1;
      countsB[b] = (countsB[b] || 0) + 1;
    }
  }

  if (totalEvaluated === 0) {
    return { kappa: 0, agreementPct: 0, totalEvaluated: 0, interpretation: 'No paired items' };
  }

  const Po = matches / totalEvaluated;

  let Pe = 0;
  classes.forEach((c) => {
    const pA = (countsA[c] || 0) / totalEvaluated;
    const pB = (countsB[c] || 0) / totalEvaluated;
    Pe += pA * pB;
  });

  let kappa = 0;
  if (Pe === 1) {
    kappa = 1;
  } else {
    kappa = (Po - Pe) / (1 - Pe);
  }

  let interpretation = 'Slight';
  if (kappa > 0.8) interpretation = 'Almost Perfect Agreement';
  else if (kappa > 0.6) interpretation = 'Substantial Agreement';
  else if (kappa > 0.4) interpretation = 'Moderate Agreement';
  else if (kappa > 0.2) interpretation = 'Fair Agreement';
  else interpretation = 'Slight / Poor Agreement';

  return {
    kappa: Number(kappa.toFixed(3)),
    agreementPct: Number((Po * 100).toFixed(1)),
    totalEvaluated,
    matches,
    disagreements: totalEvaluated - matches,
    interpretation,
  };
}

export function AgreementResolverModal({
  show,
  onClose,
  dataItems,
  currentAnnotations,
  selectedColumn,
  labelsList,
  onApplyAdjudicated,
  onToast,
}) {
  const [secondAnnotations, setSecondAnnotations] = useState([]);
  const [annotator2Name, setAnnotator2Name] = useState('Annotator B');
  const [adjudications, setAdjudications] = useState({}); // rowIdx -> label
  const [filterMode, setFilterMode] = useState('disagreements'); // 'disagreements' | 'all'
  const fileInputRef = useRef(null);

  // Extract classes
  const classes = useMemo(() => labelsList.map((l) => l.name), [labelsList]);

  // Extract label strings
  const annotator1Labels = useMemo(
    () => currentAnnotations.map((a) => (a ? a.label : null)),
    [currentAnnotations]
  );

  const annotator2Labels = useMemo(
    () => secondAnnotations.map((a) => (a ? a.label : null)),
    [secondAnnotations]
  );

  // Parse uploaded second file (can be session JSON or CSV)
  const handleUploadSecondFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      try {
        // Try JSON format
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            // Check if array of strings or {label} objects
            const labels = parsed.map((item) =>
              typeof item === 'string' ? { label: item } : item ? { label: item.label || item._annotation_label } : null
            );
            setSecondAnnotations(labels);
            setAnnotator2Name(file.name.replace(/\.[^/.]+$/, ''));
            if (onToast) onToast(`Loaded ${labels.filter(Boolean).length} annotations from ${file.name}`, 'success');
            return;
          }
        }

        // Try CSV format
        const { headers, data } = parseCSV(text);
        let labelColIdx = headers.findIndex((h) =>
          ['label', 'category', 'annotation', 'class'].includes((h || '').toLowerCase())
        );
        if (labelColIdx === -1) labelColIdx = headers.length - 1;

        const labels = data.map((row) => (row[labelColIdx] ? { label: row[labelColIdx] } : null));
        setSecondAnnotations(labels);
        setAnnotator2Name(file.name.replace(/\.[^/.]+$/, ''));
        if (onToast) onToast(`Loaded ${labels.filter(Boolean).length} annotations from ${file.name}`, 'success');
      } catch {
        if (onToast) onToast('Failed to parse second annotator file', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Compute Kappa and stats
  const agreementStats = useMemo(() => {
    if (!secondAnnotations.length) return null;
    return calculateCohensKappa(annotator1Labels, annotator2Labels, classes);
  }, [secondAnnotations, annotator1Labels, annotator2Labels, classes]);

  // Comparison rows
  const comparisonRows = useMemo(() => {
    if (!secondAnnotations.length) return [];
    const rows = [];
    dataItems.forEach((row, idx) => {
      const l1 = annotator1Labels[idx];
      const l2 = annotator2Labels[idx];
      if (!l1 && !l2) return;

      const hasConflict = l1 && l2 && l1 !== l2;
      const isMissingOne = (l1 && !l2) || (!l1 && l2);

      if (filterMode === 'disagreements' && !hasConflict && !isMissingOne) {
        return;
      }

      rows.push({
        idx,
        text: row[selectedColumn] || '',
        label1: l1,
        label2: l2,
        hasConflict,
        isMissingOne,
        resolvedLabel: adjudications[idx] || (l1 === l2 ? l1 : l1 || l2),
      });
    });
    return rows;
  }, [dataItems, annotator1Labels, annotator2Labels, selectedColumn, adjudications, filterMode, secondAnnotations]);

  if (!show) return null;

  const handleResolveRow = (idx, chosenLabel) => {
    setAdjudications((prev) => ({
      ...prev,
      [idx]: chosenLabel,
    }));
  };

  const handleApplyToSession = () => {
    if (!onApplyAdjudicated) return;
    const updated = currentAnnotations.map((item, idx) => {
      const resolved = adjudications[idx];
      if (resolved) {
        const foundColor = labelsList.find((l) => l.name === resolved)?.colour || item?.colour;
        return { ...(item || {}), label: resolved, colour: foundColor };
      }
      return item;
    });
    onApplyAdjudicated(updated);
    if (onToast) onToast(`Applied ${Object.keys(adjudications).length} adjudicated labels to active session!`, 'success');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">
                Inter-Annotator Agreement (IAA) &amp; Adjudication
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Compute Cohen's Kappa, measure human label concordance, and resolve annotator disagreements.
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

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* File Ingestion */}
          {!secondAnnotations.length ? (
            <div className="p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 flex flex-col items-center justify-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUploadSecondFile}
                accept=".csv,.json"
                className="hidden"
              />
              <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">
                Upload Second Annotator Dataset
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mb-4">
                Load a CSV or JSON file containing labels from a second annotator to measure inter-rater reliability.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                Choose Second Annotator File
              </button>
            </div>
          ) : (
            <>
              {/* Metrics Header */}
              {agreementStats && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* Kappa Metric */}
                  <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                      Cohen's Kappa (κ)
                    </span>
                    <div className="text-3xl font-black text-purple-600 dark:text-purple-400 my-1">
                      {agreementStats.kappa}
                    </div>
                    <span className="text-xs font-semibold text-purple-800 dark:text-purple-200">
                      {agreementStats.interpretation}
                    </span>
                  </div>

                  {/* Concordance % */}
                  <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Raw Agreement
                    </span>
                    <div className="text-3xl font-black text-blue-600 dark:text-blue-400 my-1">
                      {agreementStats.agreementPct}%
                    </div>
                    <span className="text-xs text-gray-500">
                      {agreementStats.matches} / {agreementStats.totalEvaluated} agreed
                    </span>
                  </div>

                  {/* Disagreements count */}
                  <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Disagreements
                    </span>
                    <div className="text-3xl font-black text-rose-500 my-1">
                      {agreementStats.disagreements}
                    </div>
                    <span className="text-xs text-gray-500">
                      Requires resolution
                    </span>
                  </div>

                  {/* Adjudicated Count */}
                  <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Adjudicated
                    </span>
                    <div className="text-3xl font-black text-emerald-500 my-1">
                      {Object.keys(adjudications).length}
                    </div>
                    <span className="text-xs text-gray-500">
                      Decisions saved
                    </span>
                  </div>
                </div>
              )}

              {/* Table Controls */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Rows:
                  </span>
                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg text-xs">
                    <button
                      onClick={() => setFilterMode('disagreements')}
                      className={`px-2.5 py-1 rounded font-medium ${
                        filterMode === 'disagreements'
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                          : 'text-gray-500'
                      }`}
                    >
                      Disagreements Only ({agreementStats?.disagreements || 0})
                    </button>
                    <button
                      onClick={() => setFilterMode('all')}
                      className={`px-2.5 py-1 rounded font-medium ${
                        filterMode === 'all'
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                          : 'text-gray-500'
                      }`}
                    >
                      All Rows
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSecondAnnotations([]);
                    setAdjudications({});
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline"
                >
                  Upload Different File
                </button>
              </div>

              {/* Side-by-Side Adjudication Table */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold sticky top-0 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="py-2.5 px-3 w-12">#</th>
                      <th className="py-2.5 px-3">Text Sample</th>
                      <th className="py-2.5 px-3 w-32">Annotator 1</th>
                      <th className="py-2.5 px-3 w-32">{annotator2Name}</th>
                      <th className="py-2.5 px-3 w-48 text-right">Adjudicated Consensus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {comparisonRows.map((row) => {
                      const isAdjudicated = Boolean(adjudications[row.idx]);
                      return (
                        <tr
                          key={row.idx}
                          className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/40 ${
                            row.hasConflict ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono text-gray-400">
                            #{row.idx + 1}
                          </td>
                          <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300 max-w-xs truncate" title={row.text}>
                            {row.text}
                          </td>
                          <td className="py-2.5 px-3">
                            {row.label1 ? (
                              <button
                                onClick={() => handleResolveRow(row.idx, row.label1)}
                                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
                                  row.resolvedLabel === row.label1
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-500'
                                }`}
                                title="Click to accept Annotator 1"
                              >
                                {row.label1}
                              </button>
                            ) : (
                              <span className="text-gray-400 italic">None</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {row.label2 ? (
                              <button
                                onClick={() => handleResolveRow(row.idx, row.label2)}
                                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all ${
                                  row.resolvedLabel === row.label2
                                    ? 'bg-purple-600 text-white border-purple-600'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-purple-500'
                                }`}
                                title="Click to accept Annotator 2"
                              >
                                {row.label2}
                              </button>
                            ) : (
                              <span className="text-gray-400 italic">None</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <select
                              value={row.resolvedLabel || ''}
                              onChange={(e) => handleResolveRow(row.idx, e.target.value)}
                              className={`text-xs p-1 rounded-lg border outline-none font-semibold ${
                                isAdjudicated
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700'
                                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <option value="">-- Choose --</option>
                              {classes.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <span className="text-xs text-gray-400">
            Adjudications are merged locally into memory without cloud transmission.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors border border-gray-200 dark:border-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyToSession}
              disabled={Object.keys(adjudications).length === 0}
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-40"
            >
              Apply Adjudications to Dataset ({Object.keys(adjudications).length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
