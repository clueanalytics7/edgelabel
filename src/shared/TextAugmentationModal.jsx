import { useState, useMemo, useCallback } from 'react';

/**
 * Text Augmentation Engine (100% In-Browser)
 */

// Adjacent QWERTY keyboard map for realistic typo simulation
const QWERTY_NEIGHBORS = {
  q: ['w', 'a', 's'],
  w: ['q', 'e', 'a', 's', 'd'],
  e: ['w', 'r', 's', 'd', 'f'],
  r: ['e', 't', 'd', 'f', 'g'],
  t: ['r', 'y', 'f', 'g', 'h'],
  y: ['t', 'u', 'g', 'h', 'j'],
  u: ['y', 'i', 'h', 'j', 'k'],
  i: ['u', 'o', 'j', 'k', 'l'],
  o: ['i', 'p', 'k', 'l'],
  p: ['o', 'l'],
  a: ['q', 'w', 's', 'z'],
  s: ['w', 'e', 'a', 'd', 'z', 'x'],
  d: ['e', 'r', 's', 'f', 'x', 'c'],
  f: ['r', 't', 'd', 'g', 'c', 'v'],
  g: ['t', 'y', 'f', 'h', 'v', 'b'],
  h: ['y', 'u', 'g', 'j', 'b', 'n'],
  j: ['u', 'i', 'h', 'k', 'n', 'm'],
  k: ['i', 'o', 'j', 'l', 'm'],
  l: ['o', 'p', 'k'],
  z: ['a', 's', 'x'],
  x: ['z', 's', 'd', 'c'],
  c: ['x', 'd', 'f', 'v'],
  v: ['c', 'f', 'g', 'b'],
  b: ['v', 'g', 'h', 'n'],
  n: ['b', 'h', 'j', 'm'],
  m: ['n', 'j', 'k'],
};

// Common synonym / lexical substitutions
const SYNONYM_MAP = {
  good: ['great', 'excellent', 'fine', 'solid'],
  great: ['superb', 'exceptional', 'fantastic', 'good'],
  bad: ['poor', 'terrible', 'subpar', 'flawed'],
  terrible: ['awful', 'dreadful', 'horrible', 'bad'],
  quick: ['fast', 'rapid', 'speedy', 'swift'],
  fast: ['quick', 'rapid', 'speedy'],
  slow: ['sluggish', 'delayed', 'unhurried'],
  happy: ['pleased', 'glad', 'delighted', 'satisfied'],
  sad: ['unhappy', 'disappointed', 'upset'],
  important: ['critical', 'essential', 'vital', 'crucial'],
  issue: ['problem', 'glitch', 'bug', 'complication'],
  problem: ['issue', 'trouble', 'obstacle'],
  help: ['assist', 'support', 'guidance'],
  clean: ['neat', 'tidy', 'spotless'],
  difficult: ['hard', 'challenging', 'tough'],
  easy: ['simple', 'straightforward', 'effortless'],
};

export function augmentText(text, options = {}) {
  if (!text || typeof text !== 'string') return text;
  let res = text;

  // 1. Casing transformations
  if (options.casing === 'lower') {
    res = res.toLowerCase();
  } else if (options.casing === 'upper') {
    res = res.toUpperCase();
  } else if (options.casing === 'title') {
    res = res.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  } else if (options.casing === 'alternating') {
    res = res.split('').map((char, i) => (i % 2 === 0 ? char.toLowerCase() : char.toUpperCase())).join('');
  }

  // 2. Synonym replacement
  if (options.synonymSubstitution) {
    const words = res.split(/(\s+|[.,!?;:"])/);
    const substituted = words.map((w) => {
      const lower = w.toLowerCase();
      if (SYNONYM_MAP[lower] && Math.random() < (options.synonymProb || 0.4)) {
        const alts = SYNONYM_MAP[lower];
        const chosen = alts[Math.floor(Math.random() * alts.length)];
        return w[0] === w[0].toUpperCase()
          ? chosen.charAt(0).toUpperCase() + chosen.slice(1)
          : chosen;
      }
      return w;
    });
    res = substituted.join('');
  }

  // 3. Typo injection (Keyboard adjacent keys, swaps, drops, duplicates)
  if (options.typoInjection && options.typoIntensity > 0) {
    const chars = res.split('');
    const numTypos = Math.max(1, Math.min(chars.length, options.typoIntensity));
    const typoIndices = new Set();

    while (typoIndices.size < numTypos && typoIndices.size < chars.length) {
      const idx = Math.floor(Math.random() * chars.length);
      const c = chars[idx].toLowerCase();
      if (/[a-z]/.test(c)) {
        typoIndices.add(idx);
      } else if (typoIndices.size + 5 >= chars.length) {
        break;
      }
    }

    typoIndices.forEach((idx) => {
      const char = chars[idx];
      const lower = char.toLowerCase();
      const isUpper = char === char.toUpperCase() && char !== lower;
      const typoKind = Math.random();

      if (typoKind < 0.45 && QWERTY_NEIGHBORS[lower]) {
        // Neighbor key substitution
        const neighbors = QWERTY_NEIGHBORS[lower];
        const sub = neighbors[Math.floor(Math.random() * neighbors.length)];
        chars[idx] = isUpper ? sub.toUpperCase() : sub;
      } else if (typoKind < 0.70 && idx < chars.length - 1 && /[a-z]/i.test(chars[idx + 1])) {
        // Transposition / swap with next char
        const temp = chars[idx];
        chars[idx] = chars[idx + 1];
        chars[idx + 1] = temp;
      } else if (typoKind < 0.85) {
        // Duplication (stuck key)
        chars[idx] = char + char.toLowerCase();
      } else {
        // Drop character (omission)
        chars[idx] = '';
      }
    });

    res = chars.join('');
  }

  // 4. Conversational Punctuation Perturbations
  if (options.punctuationPerturb === 'strip') {
    res = res.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, '');
  } else if (options.punctuationPerturb === 'excessive') {
    if (res.endsWith('.')) res = res.slice(0, -1) + '...';
    else if (res.endsWith('?')) res = res.slice(0, -1) + '??!';
    else if (res.endsWith('!')) res = res.slice(0, -1) + '!!!';
    else res = res + '!!';
  }

  return res;
}

export function TextAugmentationModal({
  show,
  onClose,
  dataItems = [],
  selectedColumn = 0,
  columnHeaders = [],
  currentIndex = 0,
  onApplyAugmentation,
  onToast,
}) {
  const [casing, setCasing] = useState('none'); // 'none' | 'lower' | 'upper' | 'title' | 'alternating'
  const [typoInjection, setTypoInjection] = useState(true);
  const [typoIntensity, setTypoIntensity] = useState(2); // 1 to 5 typos
  const [synonymSubstitution, setSynonymSubstitution] = useState(true);
  const [punctuationPerturb, setPunctuationPerturb] = useState('none'); // 'none' | 'strip' | 'excessive'
  const [previewIdx, setPreviewIdx] = useState(currentIndex || 0);
  const [seed, setSeed] = useState(() => Math.random());
  const [isProcessing, setIsProcessing] = useState(false);

  // Synchronize initial index
  useMemo(() => {
    if (show && currentIndex >= 0 && currentIndex < dataItems.length) {
      setPreviewIdx(currentIndex);
    }
  }, [show, currentIndex, dataItems.length]);

  const activeRowText = useMemo(() => {
    if (!dataItems.length || previewIdx < 0 || previewIdx >= dataItems.length) return '';
    const item = dataItems[previewIdx];
    return String(item[selectedColumn] || '');
  }, [dataItems, previewIdx, selectedColumn]);

  const augmentedPreview = useMemo(() => {
    // depend on seed to regenerate
    if (!activeRowText) return '';
    // dummy use of seed so linter is happy and react updates
    if (seed < -1) return '';
    return augmentText(activeRowText, {
      casing: casing === 'none' ? null : casing,
      typoInjection,
      typoIntensity,
      synonymSubstitution,
      punctuationPerturb: punctuationPerturb === 'none' ? null : punctuationPerturb,
    });
  }, [activeRowText, casing, typoInjection, typoIntensity, synonymSubstitution, punctuationPerturb, seed]);

  // Batch augment all rows and append or export
  const handleBatchAppend = useCallback(() => {
    if (!dataItems.length) return;
    setIsProcessing(true);

    try {
      const augmentedItems = dataItems.map((item, idx) => {
        const origText = String(item[selectedColumn] || '');
        const augText = augmentText(origText, {
          casing: casing === 'none' ? null : casing,
          typoInjection,
          typoIntensity,
          synonymSubstitution,
          punctuationPerturb: punctuationPerturb === 'none' ? null : punctuationPerturb,
        });

        return {
          ...item,
          [selectedColumn]: augText,
          is_augmented: 'true',
          augmentation_source_row: idx + 1,
        };
      });

      if (onApplyAugmentation) {
        onApplyAugmentation(augmentedItems);
      }

      if (onToast) {
        onToast(`Generated ${augmentedItems.length} synthetic augmented rows!`, 'success');
      }
      onClose();
    } catch (err) {
      console.error(err);
      if (onToast) onToast('Augmentation failed: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [dataItems, selectedColumn, casing, typoInjection, typoIntensity, synonymSubstitution, punctuationPerturb, onApplyAugmentation, onToast, onClose]);

  // Export augmented dataset directly as CSV
  const handleDownloadCsv = useCallback(() => {
    if (!dataItems.length) return;
    setIsProcessing(true);

    try {
      const escapeCell = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
      const exportHeaders = [...columnHeaders, 'is_augmented', 'augmentation_details'];
      const rows = [exportHeaders.map(escapeCell).join(',')];

      // Add originals
      dataItems.forEach((item) => {
        const row = columnHeaders.map((h) => escapeCell(item[h]));
        row.push(escapeCell('false'));
        row.push(escapeCell('original'));
        rows.push(row.join(','));
      });

      // Add augmented
      dataItems.forEach((item, idx) => {
        const origText = String(item[selectedColumn] || '');
        const augText = augmentText(origText, {
          casing: casing === 'none' ? null : casing,
          typoInjection,
          typoIntensity,
          synonymSubstitution,
          punctuationPerturb: punctuationPerturb === 'none' ? null : punctuationPerturb,
        });

        const row = columnHeaders.map((h) => {
          if (h === selectedColumn) return escapeCell(augText);
          return escapeCell(item[h]);
        });
        row.push(escapeCell('true'));
        row.push(escapeCell(`casing:${casing},typos:${typoInjection ? typoIntensity : 0}`));
        rows.push(row.join(','));
      });

      const blob = new Blob([rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `augmented_dataset_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      if (onToast) {
        onToast(`Exported ${dataItems.length * 2} rows with synthetic perturbations!`, 'success');
      }
      onClose();
    } catch (err) {
      console.error(err);
      if (onToast) onToast('Export failed: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [dataItems, selectedColumn, columnHeaders, casing, typoInjection, typoIntensity, synonymSubstitution, punctuationPerturb, onToast, onClose]);

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
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-base">
                Synthetic Text Augmentation &amp; Noise Preview
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Perturb text samples with casing permutations, keyboard typos, and synonyms prior to training export.
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
          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-850 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            {/* Casing Options */}
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                Casing Permutation
              </label>
              <select
                value={casing}
                onChange={(e) => setCasing(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none text-xs"
              >
                <option value="none">Preserve Original Casing</option>
                <option value="lower">all lowercase</option>
                <option value="upper">ALL UPPERCASE</option>
                <option value="title">Title Case Each Word</option>
                <option value="alternating">aLtErNaTiNg cAsE</option>
              </select>
            </div>

            {/* Punctuation Options */}
            <div>
              <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                Punctuation Perturbation
              </label>
              <select
                value={punctuationPerturb}
                onChange={(e) => setPunctuationPerturb(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none text-xs"
              >
                <option value="none">Preserve Original Punctuation</option>
                <option value="strip">Strip All Punctuation</option>
                <option value="excessive">Add Conversational Emphasis (??! / ...)</option>
              </select>
            </div>

            {/* Typo Injection */}
            <div className="sm:col-span-2 pt-1 border-t border-gray-200/60 dark:border-gray-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-800 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={typoInjection}
                    onChange={(e) => setTypoInjection(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-600"
                  />
                  <span>Inject Realistic QWERTY Typos &amp; Transpositions</span>
                </label>
                {typoInjection && (
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {typoIntensity} character errors / sample
                  </span>
                )}
              </div>
              {typoInjection && (
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={typoIntensity}
                  onChange={(e) => setTypoIntensity(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
              )}
            </div>

            {/* Synonym Replacement */}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-800 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={synonymSubstitution}
                  onChange={(e) => setSynonymSubstitution(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
                />
                <span>Contextual Synonym Substitution (Adjectives &amp; Intent words)</span>
              </label>
            </div>
          </div>

          {/* Interactive Live Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-gray-500">
                Live Augmentation Comparison (Row {previewIdx + 1} of {dataItems.length})
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewIdx((p) => Math.max(0, p - 1))}
                  disabled={previewIdx <= 0}
                  className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewIdx((p) => Math.min(dataItems.length - 1, p + 1))}
                  disabled={previewIdx >= dataItems.length - 1}
                  className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40"
                >
                  Next →
                </button>
                <button
                  type="button"
                  onClick={() => setSeed(Math.random())}
                  className="px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 font-semibold"
                  title="Generate new noise roll"
                >
                  🎲 Re-roll
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Original */}
              <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400">Original Ground Truth</span>
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-sans text-xs min-h-[50px]">
                  {activeRowText || <span className="italic text-gray-400">Empty row</span>}
                </p>
              </div>

              {/* Augmented */}
              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/30 dark:bg-amber-950/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
                    Synthetic Augmented Preview
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-mono">
                    Perturbed
                  </span>
                </div>
                <p className="text-gray-900 dark:text-gray-100 leading-relaxed font-sans text-xs min-h-[50px] font-medium">
                  {augmentedPreview || <span className="italic text-gray-400">Empty row</span>}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/60">
          <span className="text-[11px] text-gray-400">
            Pre-training robustification · 100% In-Browser Memory
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors border border-gray-200 dark:border-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleBatchAppend}
              disabled={isProcessing || !dataItems.length}
              className="px-4 py-2 text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl transition border border-gray-300 dark:border-gray-700 disabled:opacity-40"
              title="Append synthetic rows to current editing session"
            >
              + Append to Active Session
            </button>
            <button
              onClick={handleDownloadCsv}
              disabled={isProcessing || !dataItems.length}
              className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-40"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download Augmented CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
