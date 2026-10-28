import { useState, useMemo, useCallback } from 'react';
import JSZip from 'jszip';

/**
 * Blinded Assignment Generator for Inter-Annotator Agreement (Cohen's Kappa).
 * Splits a master dataset into two blinded batches with a randomized overlapping
 * control sample to verify labeling reliability without annotator bias.
 */

// Helper to pseudo-randomly shuffle array
function shuffleArray(array, seed = Math.random()) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Convert data items to CSV string
function toCsvString(headers, rows) {
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = headers.map(escapeCell).join(',');
  const dataRows = rows.map((r) => headers.map((h) => escapeCell(r[h])).join(','));
  return [headerRow, ...dataRows].join('\r\n');
}

export function BlindedAssignmentModal({
  show,
  onClose,
  dataItems = [],
  columnHeaders = [],
  fileName = 'dataset.csv',
  onToast,
}) {
  const [overlapPct, setOverlapPct] = useState(20); // 10% to 50%
  const [annotatorAName, setAnnotatorAName] = useState('Annotator A');
  const [annotatorBName, setAnnotatorBName] = useState('Annotator B');
  const [randomSeed, setRandomSeed] = useState(() => Date.now());
  const [isPackaging, setIsPackaging] = useState(false);
  const [previewTab, setPreviewTab] = useState('overview'); // 'overview' | 'samples'

  const totalRows = dataItems.length;

  // Split calculation
  const stats = useMemo(() => {
    if (totalRows === 0) {
      return { controlCount: 0, uniqueA: 0, uniqueB: 0, batchASize: 0, batchBSize: 0, savingsPct: 0 };
    }
    const controlCount = Math.max(1, Math.round((totalRows * overlapPct) / 100));
    const remainder = totalRows - controlCount;
    const uniqueA = Math.floor(remainder / 2);
    const uniqueB = remainder - uniqueA;
    const batchASize = controlCount + uniqueA;
    const batchBSize = controlCount + uniqueB;
    const totalAnnotations = batchASize + batchBSize;
    // Effort savings vs 100% double-annotation (2 * totalRows)
    const savingsPct = Math.round(((2 * totalRows - totalAnnotations) / (2 * totalRows)) * 100);

    return {
      controlCount,
      uniqueA,
      uniqueB,
      batchASize,
      batchBSize,
      totalAnnotations,
      savingsPct,
    };
  }, [totalRows, overlapPct]);

  // Generate split assignments
  const splitPlan = useMemo(() => {
    if (totalRows === 0) return null;

    // Create indexed master items
    const indexed = dataItems.map((item, idx) => ({
      master_record_id: `REC-${String(idx + 1).padStart(5, '0')}`,
      master_original_index: idx,
      ...item,
    }));

    // Randomly shuffle master rows to pick control set
    // Note: use randomSeed so clicking "Re-randomize" generates a fresh distribution
    const shuffled = shuffleArray(indexed);

    const controlItems = shuffled.slice(0, stats.controlCount).map((item) => ({
      ...item,
      assignment_type: 'CONTROL_OVERLAP',
    }));

    const uniqueAItems = shuffled.slice(stats.controlCount, stats.controlCount + stats.uniqueA).map((item) => ({
      ...item,
      assignment_type: 'SOLO_A',
    }));

    const uniqueBItems = shuffled.slice(stats.controlCount + stats.uniqueA).map((item) => ({
      ...item,
      assignment_type: 'SOLO_B',
    }));

    // Combine & re-shuffle independently for Annotator A
    const rawBatchA = [...controlItems, ...uniqueAItems];
    const shuffledBatchA = shuffleArray(rawBatchA).map((item, seq) => ({
      task_sequence: seq + 1,
      ...item,
    }));

    // Combine & re-shuffle independently for Annotator B
    const rawBatchB = [...controlItems, ...uniqueBItems];
    const shuffledBatchB = shuffleArray(rawBatchB).map((item, seq) => ({
      task_sequence: seq + 1,
      ...item,
    }));

    return {
      controlItems,
      uniqueAItems,
      uniqueBItems,
      batchA: shuffledBatchA,
      batchB: shuffledBatchB,
    };
  }, [dataItems, totalRows, stats, randomSeed]);

  const handleDownloadZip = useCallback(async () => {
    if (!splitPlan || totalRows === 0) return;
    setIsPackaging(true);

    try {
      const zip = new JSZip();
      const baseName = fileName.replace(/\.[^/.]+$/, '');

      // Build Headers: Put tracking columns first
      const exportHeaders = ['master_record_id', 'task_sequence', ...columnHeaders];

      const csvContentA = toCsvString(exportHeaders, splitPlan.batchA);
      const csvContentB = toCsvString(exportHeaders, splitPlan.batchB);

      // Sanitize annotator file names
      const safeNameA = annotatorAName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'Annotator_A';
      const safeNameB = annotatorBName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'Annotator_B';

      zip.file(`${safeNameA}_Batch_${baseName}.csv`, csvContentA);
      zip.file(`${safeNameB}_Batch_${baseName}.csv`, csvContentB);

      // Create Blinded Manifest Key for Lead Adjudicator
      const manifest = {
        project: 'EdgeLabel Blinded Assignment',
        organization: 'Cueligence',
        generatedAt: new Date().toISOString(),
        masterFile: fileName,
        totalDatasetRows: totalRows,
        overlapPercentage: overlapPct,
        cohensKappaControlCount: stats.controlCount,
        uniqueCountAnnotatorA: stats.uniqueA,
        uniqueCountAnnotatorB: stats.uniqueB,
        annotators: {
          annotatorA: annotatorAName,
          annotatorB: annotatorBName,
        },
        controlSampleRecordIds: splitPlan.controlItems.map((c) => c.master_record_id),
        auditNotes:
          "Both annotator batches have had control samples shuffled independently to prevent benchmark detection. Use EdgeLabel's Agreement Resolver to compute Cohen's Kappa over the control records once labeling is completed.",
      };

      zip.file(`Blinded_Control_Key_${baseName}.json`, JSON.stringify(manifest, null, 2));

      // Add Readme / Instructions for Annotators
      const readmeText = `========================================================================
EDGELABEL MULTI-ANNOTATOR BLINDED ASSIGNMENT
Parent Organization: Cueligence
========================================================================

DATASET: ${fileName}
CREATED: ${new Date().toLocaleString()}

DISTRIBUTION INSTRUCTIONS:
1. Distribute "${safeNameA}_Batch_${baseName}.csv" to ${annotatorAName}.
2. Distribute "${safeNameB}_Batch_${baseName}.csv" to ${annotatorBName}.
3. DO NOT SHARE "Blinded_Control_Key_${baseName}.json" with annotators.
   Keep it secure for post-annotation adjudication.

BLINDED DESIGN:
- Total Master Rows: ${totalRows}
- Shared Control Samples (for Cohen's Kappa): ${stats.controlCount} (${overlapPct}%)
- Unique Rows for ${annotatorAName}: ${stats.uniqueA}
- Unique Rows for ${annotatorBName}: ${stats.uniqueB}
- The control rows are randomly interspersed so annotators cannot predict
  which items are evaluation controls vs. solo items.

ADJUDICATION & AGREEMENT:
Once both annotators complete their labels:
1. Open EdgeLabel Studio (https://clue-analytics.web.app/ or local instance).
2. Click "Agreement" (Inter-Annotator Agreement / Cohen's Kappa).
3. Load ${annotatorAName}'s completed dataset as Primary.
4. Upload ${annotatorBName}'s completed dataset as Secondary.
5. EdgeLabel will automatically compute Cohen's Kappa (κ), flag conflicting
   labels, and permit 1-click majority resolution.
========================================================================`;

      zip.file('INSTRUCTIONS_FOR_ANNOTATORS.txt', readmeText);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Blinded_Split_${baseName}_${overlapPct}pct_overlap.zip`;
      link.click();
      URL.revokeObjectURL(downloadUrl);

      if (onToast) {
        onToast(`Blinded batches & adjudication key exported (.zip)`, 'success');
      }
      onClose();
    } catch (err) {
      console.error('Failed to create blinded zip package:', err);
      if (onToast) onToast('Failed to create ZIP package: ' + err.message, 'error');
    } finally {
      setIsPackaging(false);
    }
  }, [splitPlan, totalRows, fileName, columnHeaders, annotatorAName, annotatorBName, overlapPct, stats, onToast, onClose]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-base">
                Multi-Annotator Blinded Assignment Generator
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Split master CSV into double-blinded batches with control overlap for Cohen's Kappa evaluation.
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

        {/* Content Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5 text-xs text-gray-700 dark:text-gray-300">
          {totalRows === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-gray-500">Please load or upload a CSV dataset first to generate blinded splits.</p>
            </div>
          ) : (
            <>
              {/* Configuration Panel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-850 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <div>
                  <label className="block font-semibold mb-1 text-gray-600 dark:text-gray-400">
                    Annotator 1 Identifier
                  </label>
                  <input
                    type="text"
                    value={annotatorAName}
                    onChange={(e) => setAnnotatorAName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 outline-none text-xs"
                    placeholder="Annotator A"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-gray-600 dark:text-gray-400">
                    Annotator 2 Identifier
                  </label>
                  <input
                    type="text"
                    value={annotatorBName}
                    onChange={(e) => setAnnotatorBName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 outline-none text-xs"
                    placeholder="Annotator B"
                  />
                </div>

                <div className="sm:col-span-2 pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-gray-700 dark:text-gray-300">
                      Shared Control Overlap: <span className="text-purple-600 dark:text-purple-400 font-bold">{overlapPct}%</span>
                    </label>
                    <span className="text-[11px] text-gray-400">
                      Standard: 15% – 25% for reliable Cohen's Kappa (κ)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={overlapPct}
                    onChange={(e) => setOverlapPct(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 px-1 mt-1 font-mono">
                    <span>10% (High efficiency)</span>
                    <span>20% (Recommended)</span>
                    <span>35%</span>
                    <span>50% (High rigor)</span>
                  </div>
                </div>
              </div>

              {/* Statistical Distribution Visualizer */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800/50">
                  <div className="text-[11px] font-medium text-purple-700 dark:text-purple-300">Shared Controls</div>
                  <div className="text-xl font-extrabold text-purple-900 dark:text-purple-200 mt-0.5">
                    {stats.controlCount}
                  </div>
                  <div className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5">Dual-annotated for κ</div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/50">
                  <div className="text-[11px] font-medium text-blue-700 dark:text-blue-300">Batch {annotatorAName}</div>
                  <div className="text-xl font-extrabold text-blue-900 dark:text-blue-200 mt-0.5">
                    {stats.batchASize}
                  </div>
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">
                    {stats.controlCount} ctrl + {stats.uniqueA} solo
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/50">
                  <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Batch {annotatorBName}</div>
                  <div className="text-xl font-extrabold text-emerald-900 dark:text-emerald-200 mt-0.5">
                    {stats.batchBSize}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {stats.controlCount} ctrl + {stats.uniqueB} solo
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/50">
                  <div className="text-[11px] font-medium text-amber-700 dark:text-amber-300">Effort Savings</div>
                  <div className="text-xl font-extrabold text-amber-900 dark:text-amber-200 mt-0.5">
                    {stats.savingsPct}%
                  </div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">vs. 100% double-coding</div>
                </div>
              </div>

              {/* Shuffling & Blinding Assurance Card */}
              <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      Double-Blind Randomization Enforced
                    </span>
                    <button
                      type="button"
                      onClick={() => setRandomSeed(Date.now())}
                      className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>🔄 Reshuffle Seed</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    Control samples are independently permuted inside each batch. Annotators cannot deduce whether an item is a control sample or unique assignment. The master record IDs are securely preserved in <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">Blinded_Control_Key.json</code> for the project lead.
                  </p>
                </div>
              </div>

              {/* Sample Inspection Preview */}
              <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-800/60 px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 text-[11px] uppercase tracking-wider">
                    Package Contents Preview
                  </span>
                  <span className="text-[11px] text-gray-400">Total Master Rows: {totalRows}</span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800 text-[11px]">
                  <div className="px-4 py-2 flex items-center justify-between">
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                      📄 {annotatorAName.replace(/\s+/g, '_')}_Batch_{fileName}
                    </span>
                    <span className="text-gray-500">{stats.batchASize} rows (CSV)</span>
                  </div>
                  <div className="px-4 py-2 flex items-center justify-between">
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      📄 {annotatorBName.replace(/\s+/g, '_')}_Batch_{fileName}
                    </span>
                    <span className="text-gray-500">{stats.batchBSize} rows (CSV)</span>
                  </div>
                  <div className="px-4 py-2 flex items-center justify-between bg-purple-50/30 dark:bg-purple-950/20">
                    <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">
                      🔑 Blinded_Control_Key_{fileName.replace(/\.[^/.]+$/, '')}.json
                    </span>
                    <span className="text-purple-600 dark:text-purple-300 font-medium">
                      {stats.controlCount} Control Records Key
                    </span>
                  </div>
                  <div className="px-4 py-2 flex items-center justify-between">
                    <span className="font-mono text-gray-600 dark:text-gray-400">
                      📝 INSTRUCTIONS_FOR_ANNOTATORS.txt
                    </span>
                    <span className="text-gray-500">Distribution Guide</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/60">
          <span className="text-[11px] text-gray-400">
            Powered by Cueligence local randomization engine · 0 server uploads
          </span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors border border-gray-200 dark:border-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleDownloadZip}
              disabled={isPackaging || totalRows === 0}
              className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-xs transition-all disabled:opacity-40 flex items-center gap-1.5"
            >
              {isPackaging ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Packaging ZIP...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export Blinded Packages (.zip)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
