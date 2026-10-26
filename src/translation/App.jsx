import { useState, useEffect, useCallback, useMemo } from 'react';
import { parseCSV } from '../shared/csvParser.js';
import { useTheme, savedTheme } from '../shared/theme.js';
import { Toast } from '../shared/Toast.jsx';
import { FileUpload, FilePreview } from '../shared/FileComponents.jsx';
import { Footer } from '../shared/Footer.jsx';
import { SuiteSwitcher } from '../shared/SuiteSwitcher.jsx';

// ─── Glossary Modal ──────────────────────────────────────────────────────────
function GlossaryModal({ show, onClose, glossary, onSaveGlossary, onToast }) {
  const [terms, setTerms] = useState(glossary || []);
  const [newSource, setNewSource] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [isDnt, setIsDnt] = useState(false); // Do Not Translate

  if (!show) return null;

  const handleAddTerm = () => {
    if (!newSource.trim()) return;
    const item = {
      id: `term_${Date.now()}`,
      source: newSource.trim(),
      target: isDnt ? newSource.trim() : newTarget.trim(),
      isDnt,
    };
    const updated = [...terms, item];
    setTerms(updated);
    onSaveGlossary(updated);
    setNewSource('');
    setNewTarget('');
    setIsDnt(false);
    if (onToast) onToast(`Added term "${item.source}" to glossary`, 'success');
  };

  const handleDeleteTerm = (id) => {
    const updated = terms.filter((t) => t.id !== id);
    setTerms(updated);
    onSaveGlossary(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-xl w-full border border-gray-100 dark:border-gray-800 p-6 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Terminology &amp; Glossary Management</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Standardize brand names, acronyms, and mandatory translations.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">✕</button>
        </div>

        {/* Add Term Form */}
        <div className="bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 mb-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Source Term</label>
              <input type="text" value={newSource} onChange={(e) => setNewSource(e.target.value)} placeholder="e.g. EdgeLabel, Checkout"
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">
                {isDnt ? 'Protected Text (Do Not Translate)' : 'Target Translation'}
              </label>
              <input type="text" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} disabled={isDnt}
                placeholder={isDnt ? '(Exact term preserved)' : 'e.g. Finaliser la commande'}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={isDnt} onChange={(e) => setIsDnt(e.target.checked)} className="rounded text-green-600" />
              <span>Do Not Translate (DNT / Brand / Code)</span>
            </label>
            <button onClick={handleAddTerm} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold">
              + Add Term
            </button>
          </div>
        </div>

        {/* Existing Terms List */}
        <div className="overflow-y-auto flex-1 space-y-1.5 pr-1">
          {terms.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-6">No glossary terms defined yet.</p>
          ) : (
            terms.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-850 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-gray-900 dark:text-white truncate">"{t.source}"</span>
                  <span className="text-gray-400">→</span>
                  <span className={`truncate ${t.isDnt ? 'text-amber-600 dark:text-amber-400 font-mono' : 'text-green-600 dark:text-green-400 font-medium'}`}>
                    {t.target}
                  </span>
                  {t.isDnt && <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-semibold">DNT</span>}
                </div>
                <button onClick={() => handleDeleteTerm(t.id)} className="text-gray-400 hover:text-red-500 text-sm ml-2">×</button>
              </div>
            ))
          )}
        </div>

        <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl w-full text-xs font-semibold">
          Done
        </button>
      </div>
    </div>
  );
}

// ─── Settings Modal ──────────────────────────────────────────────────────────
function SettingsModal({ show, onClose, columnHeaders, selectedColumn, setSelectedColumn, setHasSelectedColumn, targetLang, setTargetLang }) {
  const save = () => {
    setSelectedColumn(parseInt(document.getElementById('col-select-t').value));
    setHasSelectedColumn(true);
    onClose();
  };
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-md w-full border border-gray-100 dark:border-gray-700">
        <h2 className="text-base font-bold mb-4 text-gray-900 dark:text-white">Localization Settings</h2>
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Source Column to Localize</label>
        <select id="col-select-t" defaultValue={selectedColumn}
          className="w-full p-2 mb-4 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs outline-none">
          {columnHeaders.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
        </select>

        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Target Language / Locale</label>
        <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}
          className="w-full p-2 mb-4 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs outline-none">
          <option value="es">Spanish (es-ES / es-419)</option>
          <option value="fr">French (fr-FR)</option>
          <option value="de">German (de-DE)</option>
          <option value="it">Italian (it-IT)</option>
          <option value="pt">Portuguese (pt-BR / pt-PT)</option>
          <option value="ja">Japanese (ja-JP)</option>
          <option value="zh">Chinese (zh-CN / zh-TW)</option>
          <option value="ar">Arabic (ar-SA)</option>
          <option value="hi">Hindi (hi-IN)</option>
        </select>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-semibold">Cancel</button>
          <button onClick={save} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold">Save Settings</button>
        </div>
      </div>
    </div>
  );
}

// ─── Machine Translation Consent Modal ───────────────────────────────────────
function ApiConsentModal({ show, onClose, onConfirm }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 text-amber-500 mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="font-bold text-gray-900 dark:text-white text-base">Privacy &amp; Data Transmission Notice</h3>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          By default, EdgeLabel processes all datasets 100% locally on your machine. Using automated translation drafts transmits this row's source text to the external translation API endpoint over HTTPS.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
          Do not proceed if this dataset contains confidential secrets, PHI, or classified NDA information.
        </p>
        <div className="flex items-center justify-end gap-2.5">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            Cancel (Keep 100% Offline)
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-xs font-bold rounded-xl bg-green-600 hover:bg-green-700 text-white">
            I Understand &amp; Consent
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Translation Studio App ─────────────────────────────────────────────
export default function App() {
  const [dataItems, setDataItems]           = useState([]);
  const [translations, setTranslations]     = useState([]); // { text, comment, status, history }
  const [currentIndex, setCurrentIndex]     = useState(0);
  const [fileName, setFileName]             = useState('');
  const [columnHeaders, setColumnHeaders]   = useState([]);
  const [selectedColumn, setSelectedColumn] = useState(0);
  const [targetLang, setTargetLang]         = useState('es');
  const [theme, setTheme]                   = useState(savedTheme);
  const [showSettings, setShowSettings]     = useState(false);
  const [showGlossary, setShowGlossary]     = useState(false);
  const [hasSelectedColumn, setHasSelectedColumn] = useState(false);
  const [translationInput, setTranslationInput] = useState('');
  const [tempComment, setTempComment]       = useState('');
  const [statusFilter, setStatusFilter]     = useState('all'); // all | draft | in_review | approved | flagged
  const [glossary, setGlossary]             = useState([
    { id: 'g1', source: 'EdgeLabel', target: 'EdgeLabel', isDnt: true },
    { id: 'g2', source: 'Dataset', target: 'Conjunto de datos', isDnt: false },
    { id: 'g3', source: 'Checkout', target: 'Finalizar compra', isDnt: false },
  ]);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [undoStack, setUndoStack]           = useState([]);
  const [redoStack, setRedoStack]           = useState([]);
  const [toast, setToast]                   = useState(null);

  const showToast = useCallback((msg, type = 'info') => setToast({ message: msg, type }), []);
  useTheme(theme);

  // Load sample dataset if empty
  useEffect(() => {
    const saved = localStorage.getItem('translation_studio_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.dataItems?.length) {
          setDataItems(parsed.dataItems);
          setTranslations(parsed.translations || []);
          setFileName(parsed.fileName || '');
          setColumnHeaders(parsed.columnHeaders || []);
          setSelectedColumn(parsed.selectedColumn || 0);
          setHasSelectedColumn(parsed.hasSelectedColumn || false);
          if (parsed.glossary) setGlossary(parsed.glossary);
          return;
        }
      } catch {
        // Fallback
      }
    }
  }, []);

  // Autosave
  useEffect(() => {
    if (!dataItems.length) return;
    localStorage.setItem(
      'translation_studio_session',
      JSON.stringify({
        dataItems,
        translations,
        fileName,
        columnHeaders,
        selectedColumn,
        hasSelectedColumn,
        glossary,
        targetLang,
      })
    );
  }, [dataItems, translations, fileName, columnHeaders, selectedColumn, hasSelectedColumn, glossary, targetLang]);

  const currentItem = dataItems[currentIndex];
  const currentTranslation = translations[currentIndex] || null;
  const currentSourceText = (currentItem && currentItem[selectedColumn]) || '';

  // Synchronize inputs when navigating rows
  useEffect(() => {
    if (currentTranslation) {
      setTranslationInput(currentTranslation.text || '');
      setTempComment(currentTranslation.comment || '');
    } else {
      setTranslationInput('');
      setTempComment('');
    }
  }, [currentIndex, currentTranslation]);

  // Highlight Glossary matches in current source text
  const glossaryMatches = useMemo(() => {
    if (!currentSourceText || !glossary.length) return [];
    const found = [];
    const lower = currentSourceText.toLowerCase();
    glossary.forEach((term) => {
      if (lower.includes(term.source.toLowerCase())) {
        found.push(term);
      }
    });
    return found;
  }, [currentSourceText, glossary]);

  // Localization QA Warnings
  const qaWarnings = useMemo(() => {
    const warnings = [];
    if (!translationInput.trim()) return warnings;

    // 1. Ratio check
    const srcLen = currentSourceText.length;
    const tgtLen = translationInput.length;
    if (srcLen > 10) {
      const ratio = tgtLen / srcLen;
      if (ratio < 0.25) warnings.push('Target text suspiciously short (<25% of source length)');
      else if (ratio > 3.0) warnings.push('Target text unusually long (>300% of source length)');
    }

    // 2. Untranslated source check
    if (currentSourceText.trim() === translationInput.trim() && srcLen > 15) {
      warnings.push('Translation matches source text verbatim (possible untranslated segment)');
    }

    // 3. Glossary verification
    glossaryMatches.forEach((term) => {
      if (term.isDnt) {
        if (!translationInput.toLowerCase().includes(term.source.toLowerCase())) {
          warnings.push(`Missing protected brand/DNT term: "${term.source}"`);
        }
      }
    });

    return warnings;
  }, [currentSourceText, translationInput, glossaryMatches]);

  // File Upload
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers, data } = parseCSV(e.target.result);
      if (!data.length) { showToast('No valid data found in CSV.', 'error'); return; }
      setFileName(file.name);
      setColumnHeaders(headers);
      setDataItems(data);
      setTranslations(new Array(data.length).fill(null));
      setCurrentIndex(0);
      setHasSelectedColumn(false);
      showToast(`Loaded ${data.length} rows for localization!`, 'success');
    };
    reader.onerror = () => showToast('Could not read the file.', 'error');
    reader.readAsText(file);
  }, [showToast]);

  // Save Translation
  const handleCommitTranslation = useCallback((newStatus = 'in_review', advance = true) => {
    if (!hasSelectedColumn) { showToast('Select a column in Settings first.', 'warning'); setShowSettings(true); return; }
    if (currentIndex >= dataItems.length) return;

    setUndoStack((prev) => [...prev, { index: currentIndex, state: translations[currentIndex] }]);
    setRedoStack([]);

    const prevHistory = translations[currentIndex]?.history || [];
    const newEntry = {
      text: translationInput,
      comment: tempComment.trim() || null,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      history: [
        ...prevHistory,
        {
          text: translationInput,
          status: newStatus,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ].slice(-5), // Keep last 5 revisions
    };

    setTranslations((prev) => {
      const next = [...prev];
      next[currentIndex] = newEntry;
      return next;
    });

    showToast(`Saved as ${newStatus.toUpperCase()}`, 'success');
    if (advance && currentIndex < dataItems.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [hasSelectedColumn, currentIndex, dataItems.length, translations, translationInput, tempComment, showToast]);

  // Automated first-pass draft (Consent Gated)
  const handleAutoTranslateDraft = () => {
    setShowConsentModal(true);
  };

  const executeAutoTranslate = () => {
    setShowConsentModal(false);
    // Client-side automated first-pass generation
    // In production, user can provide their own endpoint or use pre-loaded dictionary
    let draft = currentSourceText;
    // Apply glossary substitutions
    glossary.forEach((term) => {
      if (!term.isDnt && term.target) {
        const regex = new RegExp(`\\b${term.source}\\b`, 'gi');
        draft = draft.replace(regex, term.target);
      }
    });

    setTranslationInput(draft);
    showToast('Generated initial terminology draft! Please review and finalize.', 'info');
  };

  // Export handlers
  const handleExportCsv = () => {
    const headers = [...columnHeaders, 'Target_Locale', 'Translation', 'Review_Status', 'Reviewer_Comment'];
    const rows = [headers.map((h) => `"${h}"`).join(',')];
    dataItems.forEach((row, i) => {
      const t = translations[i];
      const cells = [
        ...row,
        targetLang,
        t ? t.text : '',
        t ? t.status || 'draft' : 'untranslated',
        t ? t.comment || '' : '',
      ];
      rows.push(cells.map((c) => `"${String(c || '').replace(/"/g, '""')}"`).join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `localized_${targetLang}_${fileName || 'dataset.csv'}`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Exported localized dataset (.csv)!', 'success');
  };

  const handleExportJson = () => {
    const output = dataItems.map((row, i) => ({
      id: i + 1,
      source: row[selectedColumn] || '',
      translation: translations[i]?.text || '',
      status: translations[i]?.status || 'draft',
      comment: translations[i]?.comment || null,
      targetLanguage: targetLang,
    }));
    const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `translation_dictionary_${targetLang}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Exported localization dictionary (.json)!', 'success');
  };

  // Progress stats
  const stats = useMemo(() => {
    let approved = 0;
    let inReview = 0;
    let flagged = 0;
    let draft = 0;

    translations.forEach((t) => {
      if (!t || !t.text) return;
      if (t.status === 'approved') approved++;
      else if (t.status === 'in_review') inReview++;
      else if (t.status === 'flagged') flagged++;
      else draft++;
    });

    const total = dataItems.length;
    const completed = approved + inReview + draft + flagged;
    return { approved, inReview, flagged, draft, total, completed };
  }, [translations, dataItems]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 font-sans antialiased text-gray-900 dark:text-gray-100 transition-colors">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <a href="./index.html" className="flex items-center gap-2 font-bold text-base text-green-600 dark:text-green-400 hover:text-green-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span>EdgeTranslate</span>
            </a>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 font-semibold hidden md:inline">
              Dataset Localisation Studio
            </span>
            <SuiteSwitcher activeProductId="edgetranslate" />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowGlossary(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 flex items-center gap-1.5 transition-colors">
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Glossary ({glossary.length})</span>
            </button>

            <button onClick={() => setShowSettings(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 transition-colors">
              Settings
            </button>

            <select value={theme} onChange={(e) => setTheme(e.target.value)} aria-label="Theme"
              className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-xl px-2.5 py-1.5 outline-none">
              <option value="system">Auto</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>
      </header>

      {/* ── Main Layout ─────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 flex flex-col gap-4">
        {!dataItems.length ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm max-w-2xl mx-auto my-auto text-center">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/40 rounded-2xl flex items-center justify-center text-green-600 mx-auto mb-4">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Human-Reviewed Dataset Localisation Studio</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto leading-relaxed">
              Translate and review product catalogues, FAQ datasets, and AI fine-tuning corpora with built-in terminology enforcement, QA checks, and approval workflows.
            </p>
            <FileUpload onFileUpload={handleFileUpload} />
          </div>
        ) : (
          <>
            {/* Top Stat Toolbar */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  File: <strong className="text-gray-800 dark:text-gray-200">{fileName}</strong>
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                  Target: {targetLang.toUpperCase()}
                </span>
              </div>

              {/* Progress Badges */}
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                  {stats.approved} Approved
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
                  {stats.inReview} In Review
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-800">
                  {stats.flagged} Flagged
                </span>
                <span className="text-xs text-gray-400 font-mono ml-1">
                  ({stats.completed} of {stats.total})
                </span>
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2">
                <button onClick={handleExportCsv} className="px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-xs transition-colors">
                  ↓ Localized CSV
                </button>
                <button onClick={handleExportJson} className="px-3 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl transition-colors border border-gray-200 dark:border-gray-700">
                  ↓ JSON Dict
                </button>
              </div>
            </div>

            {/* Main Workbench Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
              {/* Left 2 Cols: Source & Translation Editor */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                {/* Source Segment Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Source Text (Row {currentIndex + 1} of {dataItems.length})
                    </span>
                    {currentTranslation?.status && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        currentTranslation.status === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                        currentTranslation.status === 'flagged' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}>
                        {currentTranslation.status}
                      </span>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-750 text-sm text-gray-800 dark:text-gray-100 leading-relaxed min-h-[90px]">
                    {currentSourceText || <span className="text-gray-400 italic">Empty cell</span>}
                  </div>

                  {/* Glossary Term Matches Alert */}
                  {glossaryMatches.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Glossary Matches:</span>
                      {glossaryMatches.map((t) => (
                        <button key={t.id} onClick={() => setTranslationInput((prev) => (prev ? `${prev} ${t.target}` : t.target))}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 text-xs font-medium hover:bg-green-100 transition-colors"
                          title="Click to insert into translation">
                          <span>"{t.source}"</span>
                          <span className="text-gray-400">→</span>
                          <span className="font-bold">{t.target}</span>
                          {t.isDnt && <span className="text-[9px] bg-amber-500 text-white px-1 rounded">DNT</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Translation Target Editor Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm flex flex-col gap-3 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Human Translation &amp; Localization ({targetLang.toUpperCase()})
                    </span>
                    <button onClick={handleAutoTranslateDraft} className="text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1">
                      <span>⚡ Auto-Draft with Glossary</span>
                    </button>
                  </div>

                  <textarea rows={4} value={translationInput} onChange={(e) => setTranslationInput(e.target.value)}
                    placeholder="Type human-reviewed translation here..."
                    className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500 text-sm leading-relaxed" />

                  {/* QA Warnings */}
                  {qaWarnings.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded-xl space-y-1">
                      {qaWarnings.map((w, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                          <span>⚠️</span>
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reviewer Note */}
                  <input type="text" value={tempComment} onChange={(e) => setTempComment(e.target.value)}
                    placeholder="Optional reviewer note / translator comment..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 outline-none" />

                  {/* Action Workflow Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex <= 0}
                        className="px-3 py-2 text-xs font-semibold rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 disabled:opacity-30">
                        ← Prev
                      </button>
                      <button onClick={() => setCurrentIndex((i) => Math.min(dataItems.length - 1, i + 1))} disabled={currentIndex >= dataItems.length - 1}
                        className="px-3 py-2 text-xs font-semibold rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 disabled:opacity-30">
                        Next →
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => handleCommitTranslation('flagged', true)}
                        className="px-3 py-2 text-xs font-semibold rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100">
                        🚩 Flag for Lead
                      </button>
                      <button onClick={() => handleCommitTranslation('in_review', true)}
                        className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white">
                        Save as Draft
                      </button>
                      <button onClick={() => handleCommitTranslation('approved', true)}
                        className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
                        ✓ Approve &amp; Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Col: Translation History & Row Navigator */}
              <div className="flex flex-col gap-4">
                {/* Revisions & History */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">
                    Revision History (Row #{currentIndex + 1})
                  </span>
                  {currentTranslation?.history?.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {currentTranslation.history.map((h, hIdx) => (
                        <div key={hIdx} className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 text-xs flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[10px] text-gray-400">
                            <span>{h.timestamp}</span>
                            <span className="font-semibold uppercase text-green-600">{h.status}</span>
                          </div>
                          <p className="text-gray-800 dark:text-gray-200 font-mono text-[11px] truncate">"{h.text}"</p>
                          <button onClick={() => setTranslationInput(h.text)} className="text-[10px] text-blue-500 hover:underline text-left self-start mt-0.5">
                            Restore this version
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No previous revisions for this row.</p>
                  )}
                </div>

                {/* Dataset Navigation Strip */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rows</span>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-[11px] px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none">
                      <option value="all">All Rows</option>
                      <option value="approved">Approved</option>
                      <option value="in_review">In Review</option>
                      <option value="flagged">Flagged</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 overflow-y-auto flex-1 max-h-[380px] pr-1">
                    {dataItems.map((row, idx) => {
                      const t = translations[idx];
                      if (statusFilter !== 'all' && t?.status !== statusFilter) return null;
                      const isCurrent = idx === currentIndex;
                      return (
                        <div key={idx} onClick={() => setCurrentIndex(idx)}
                          className={`p-2 rounded-xl border cursor-pointer transition-all text-xs flex items-center justify-between ${
                            isCurrent
                              ? 'bg-green-50 dark:bg-green-950/50 border-green-500 text-green-900 dark:text-green-200 shadow-xs'
                              : 'bg-gray-50/50 dark:bg-gray-850 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                          }`}>
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-mono text-[10px] text-gray-400">#{idx + 1}</span>
                            <span className="truncate">{row[selectedColumn] || 'Empty'}</span>
                          </div>
                          {t?.status && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                              t.status === 'approved' ? 'bg-emerald-600 text-white' :
                              t.status === 'flagged' ? 'bg-rose-500 text-white' :
                              'bg-amber-500 text-white'
                            }`}>
                              {t.status}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />

      {/* Modals */}
      <GlossaryModal show={showGlossary} onClose={() => setShowGlossary(false)}
        glossary={glossary} onSaveGlossary={(g) => setGlossary(g)} onToast={showToast} />
      <SettingsModal show={showSettings} onClose={() => setShowSettings(false)}
        columnHeaders={columnHeaders} selectedColumn={selectedColumn}
        setSelectedColumn={setSelectedColumn} setHasSelectedColumn={setHasSelectedColumn}
        targetLang={targetLang} setTargetLang={setTargetLang} />
      <ApiConsentModal show={showConsentModal} onClose={() => setShowConsentModal(false)}
        onConfirm={executeAutoTranslate} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
