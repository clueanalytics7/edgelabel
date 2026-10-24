import { useState, useEffect, useCallback, useMemo } from 'react';
import { parseCSV } from '../shared/csvParser.js';
import { useTheme, savedTheme } from '../shared/theme.js';
import { Toast } from '../shared/Toast.jsx';
import { FileUpload, FilePreview } from '../shared/FileComponents.jsx';
import { Footer } from '../shared/Footer.jsx';

// ─── Analytics helpers (consent-gated) ───────────────────────────────────────

function loadGA() {
  if (window._gaLoaded) return;
  window._gaLoaded = true;
  window.disableAnalytics = false;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=G-98SPL77FT1';
  s.onload = () => { gtag('js', new Date()); gtag('config', 'G-98SPL77FT1'); };
  document.head.appendChild(s);
}

window.disableAnalytics = true;
window.dataLayer = window.dataLayer || [];
function gtag() { if (!window.disableAnalytics) window.dataLayer.push(arguments); }
if (localStorage.getItem('privacyConsent') === 'true') loadGA();

// ─── Sub-components ───────────────────────────────────────────────────────────

const DEFAULT_LABELS = [
  { name: 'Positive', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { name: 'Neutral',  color: 'bg-gray-100  text-gray-800  dark:bg-gray-700  dark:text-gray-200'  },
  { name: 'Negative', color: 'bg-red-100   text-red-800   dark:bg-red-900   dark:text-red-200'   },
  { name: 'Others',   color: 'bg-blue-100  text-blue-800  dark:bg-blue-900  dark:text-blue-200'  },
];

function WelcomeScreen({ onGetStarted }) {
  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
      <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-white">Welcome to EdgeLabel</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">Annotate CSV datasets entirely in your browser — no uploads, no accounts.</p>
      <ul className="list-disc list-inside text-left text-gray-600 dark:text-gray-300 mb-6 space-y-1 max-w-md mx-auto text-sm">
        <li>Upload a UTF-8 CSV file</li>
        <li>Select the column to annotate in Settings</li>
        <li>Assign labels using buttons or keyboard shortcuts (1–9)</li>
        <li>Navigate rows with ← → arrow keys</li>
        <li>Export as CSV or JSON when done</li>
      </ul>
      <button onClick={onGetStarted} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
        Get Started
      </button>
    </div>
  );
}

function SettingsModal({ show, onClose, columnHeaders, selectedColumn, setSelectedColumn, labels, setLabels, setHasSelectedColumn }) {
  const [tempLabels, setTempLabels] = useState(labels);
  const [newLabel, setNewLabel] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { if (show) setTempLabels(labels); }, [show, labels]);

  const addLabel = () => {
    const trimmed = newLabel.trim();
    if (!trimmed || tempLabels.some(l => l.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Label must be non-empty and unique.');
      return;
    }
    setTempLabels(prev => [...prev, { name: trimmed, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' }]);
    setNewLabel('');
    setError('');
  };

  const saveSettings = () => {
    if (!tempLabels.length) { setError('At least one label is required.'); return; }
    setLabels(tempLabels);
    setSelectedColumn(parseInt(document.getElementById('col-select').value));
    setHasSelectedColumn(true);
    onClose();
  };

  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Settings</h2>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Annotation column</label>
        <select id="col-select" defaultValue={selectedColumn}
          className="w-full p-2 mb-4 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm">
          {columnHeaders.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
        </select>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Labels</label>
        <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
          {tempLabels.map((l, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className={`px-2 py-1 rounded text-xs font-medium ${l.color}`}>{l.name}</span>
              <button onClick={() => setTempLabels(prev => prev.filter((_, j) => j !== i))}
                className="text-red-500 hover:text-red-700 text-sm">Remove</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-1">
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addLabel()}
            placeholder="New label name"
            className="flex-1 p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
          <button onClick={addLabel} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Add</button>
        </div>
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm">Cancel</button>
          <button onClick={saveSettings} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">Save</button>
        </div>
      </div>
    </div>
  );
}

function AnnotationsModal({ show, onClose, annotations, dataItems, selectedColumn }) {
  if (!show) return null;
  const annotated = annotations.filter(Boolean);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
          Annotations <span className="text-sm font-normal text-gray-500">({annotated.length} of {dataItems.length})</span>
        </h2>
        <div className="overflow-y-auto flex-1">
          {annotated.length === 0
            ? <p className="text-sm text-gray-500 dark:text-gray-400">No annotations yet.</p>
            : (
              <ul className="space-y-2">
                {annotations.map((ann, i) => ann && (
                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300 border-b dark:border-gray-700 pb-1">
                    <span className="font-medium text-gray-500 dark:text-gray-400 mr-2">#{i + 1}</span>
                    "{dataItems[i]?.[selectedColumn]}" →{' '}
                    <span className="font-medium text-blue-600 dark:text-blue-400">{ann.label}</span>
                    {ann.comment && <span className="text-gray-400 ml-2 italic">({ann.comment})</span>}
                  </li>
                ))}
              </ul>
            )}
        </div>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded w-full hover:bg-gray-700 text-sm">Close</button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [dataItems, setDataItems]           = useState([]);
  const [annotations, setAnnotations]       = useState([]);
  const [currentIndex, setCurrentIndex]     = useState(-1);
  const [fileName, setFileName]             = useState('');
  const [columnHeaders, setColumnHeaders]   = useState([]);
  const [selectedColumn, setSelectedColumn] = useState(0);
  const [labels, setLabels]                 = useState(DEFAULT_LABELS);
  const [theme, setTheme]                   = useState(savedTheme);
  const [showSettings, setShowSettings]     = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(localStorage.getItem('privacyConsent') === 'true');
  const [undoStack, setUndoStack]           = useState([]);
  const [redoStack, setRedoStack]           = useState([]);
  const [showWelcome, setShowWelcome]       = useState(true);
  const [showCommentField, setShowCommentField] = useState(false);
  const [tempComment, setTempComment]       = useState('');
  const [hasSelectedColumn, setHasSelectedColumn] = useState(false);
  const [showPreview, setShowPreview]       = useState(false);
  const [toast, setToast]                   = useState(null);

  const showToast = useCallback((message, type = 'info') => setToast({ message, type }), []);

  useTheme(theme);

  // Autosave
  useEffect(() => {
    if (!fileName || !annotations.length) return;
    const t = setInterval(() => {
      localStorage.setItem(`annotations_${fileName}`, JSON.stringify(annotations));
    }, 5000);
    return () => clearInterval(t);
  }, [annotations, fileName]);

  // Restore session on file change
  useEffect(() => {
    if (!fileName) return;
    const saved = localStorage.getItem(`annotations_${fileName}`);
    if (saved) setAnnotations(JSON.parse(saved));
  }, [fileName]);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers, data } = parseCSV(e.target.result);
      if (!data.length) { showToast('No valid data found in the CSV. Check that the file has at least one data row.', 'error'); return; }
      setFileName(file.name);
      setColumnHeaders(headers);
      setDataItems(data);
      setAnnotations(new Array(data.length).fill(null));
      setCurrentIndex(-1);
      setShowWelcome(false);
      setShowPreview(true);
      setHasSelectedColumn(false);
      setShowCommentField(false);
      setTempComment('');
      localStorage.removeItem(`annotations_${file.name}`);
      if (!window.disableAnalytics) gtag('event', 'upload_csv', { event_category: 'File', value: data.length });
    };
    reader.onerror = () => showToast('Could not read the file. Please try again.', 'error');
    reader.readAsText(file);
  }, [showToast]);

  const saveAnnotation = useCallback((label) => {
    if (currentIndex < 0) { setCurrentIndex(0); return; }
    if (currentIndex >= dataItems.length) return;
    setUndoStack(prev => [...prev, { index: currentIndex, annotation: annotations[currentIndex] }]);
    setRedoStack([]);
    setAnnotations(prev => {
      const next = [...prev];
      next[currentIndex] = { label, comment: tempComment.trim() || null };
      return next;
    });
    setTempComment('');
    if (currentIndex < dataItems.length - 1) setCurrentIndex(i => i + 1);
  }, [currentIndex, annotations, dataItems.length, tempComment]);

  const handleSelectLabel = useCallback((label) => {
    if (!hasSelectedColumn) { showToast('Please select a column to annotate in Settings first.', 'warning'); setShowSettings(true); return; }
    saveAnnotation(label);
  }, [hasSelectedColumn, saveAnnotation, showToast]);

  const nextData = useCallback(() => {
    if (!hasSelectedColumn) { showToast('Please select a column in Settings first.', 'warning'); setShowSettings(true); return; }
    if (currentIndex < dataItems.length - 1) setCurrentIndex(i => i + 1);
  }, [currentIndex, dataItems.length, hasSelectedColumn, showToast]);

  const prevData = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (!undoStack.length) return;
    const last = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, { index: currentIndex, annotation: annotations[currentIndex] }]);
    setAnnotations(prev => { const n = [...prev]; n[last.index] = last.annotation; return n; });
    setCurrentIndex(last.index);
    setUndoStack(prev => prev.slice(0, -1));
  }, [undoStack, annotations, currentIndex]);

  const redo = useCallback(() => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, { index: currentIndex, annotation: annotations[currentIndex] }]);
    setAnnotations(prev => { const n = [...prev]; n[next.index] = next.annotation; return n; });
    setCurrentIndex(next.index);
    setRedoStack(prev => prev.slice(0, -1));
  }, [redoStack, annotations, currentIndex]);

  const downloadAnnotations = useCallback((format = 'csv') => {
    let content, mimeType, ext;
    if (format === 'json') {
      const data = annotations.map((a, i) => a && ({ data: dataItems[i][selectedColumn], label: a.label, comment: a.comment || null })).filter(Boolean);
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json'; ext = 'json';
    } else if (format === 'jsonl') {
      const lines = annotations.map((a, i) => a && JSON.stringify({ data: dataItems[i][selectedColumn], label: a.label, comment: a.comment || null })).filter(Boolean);
      content = lines.join('\n');
      mimeType = 'application/jsonlines'; ext = 'jsonl';
    } else {
      const rows = ['"Data","Label","Comment"'];
      dataItems.forEach((row, i) => {
        if (!annotations[i]) return;
        const d = (row[selectedColumn] || '').replace(/"/g, '""');
        const l = annotations[i].label.replace(/"/g, '""');
        const c = (annotations[i].comment || '').replace(/"/g, '""');
        rows.push(`"${d}","${l}","${c}"`);
      });
      content = rows.join('\n');
      mimeType = 'text/csv;charset=utf-8;'; ext = 'csv';
    }
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `annotations_${fileName}.${ext}`;
    link.click();
    URL.revokeObjectURL(link.href);
    if (!window.disableAnalytics) gtag('event', `download_${format}`, { event_category: 'File' });
  }, [dataItems, annotations, selectedColumn, fileName]);

  const saveSession = useCallback(() => {
    localStorage.setItem('saved_session', JSON.stringify({ dataItems, annotations, fileName, columnHeaders, selectedColumn, labels, hasSelectedColumn, showPreview }));
    showToast('Session saved.', 'success');
  }, [dataItems, annotations, fileName, columnHeaders, selectedColumn, labels, hasSelectedColumn, showPreview, showToast]);

  const loadSession = useCallback(() => {
    const raw = localStorage.getItem('saved_session');
    if (!raw) { showToast('No saved session found.', 'warning'); return; }
    const s = JSON.parse(raw);
    setDataItems(s.dataItems); setAnnotations(s.annotations); setFileName(s.fileName);
    setColumnHeaders(s.columnHeaders); setSelectedColumn(s.selectedColumn); setLabels(s.labels);
    setHasSelectedColumn(s.hasSelectedColumn); setShowPreview(s.showPreview);
    setCurrentIndex(s.hasSelectedColumn ? 0 : -1);
    setShowWelcome(false);
    showToast('Session loaded.', 'success');
  }, [showToast]);

  const handlePrivacyConsent = (accepted) => {
    setPrivacyConsent(accepted);
    localStorage.setItem('privacyConsent', String(accepted));
    if (accepted) {
      loadGA();
      gtag('event', 'accept_privacy', { event_category: 'Privacy' });
    }
  };

  const progress = useMemo(() => {
    const count = annotations.filter(Boolean).length;
    return { count, total: dataItems.length, pct: dataItems.length ? (count / dataItems.length) * 100 : 0 };
  }, [annotations, dataItems]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (showSettings || showAnnotations) return;
      if (e.key === 'ArrowRight') nextData();
      if (e.key === 'ArrowLeft') prevData();
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveSession(); }
      const idx = parseInt(e.key) - 1;
      if (!isNaN(idx) && idx >= 0 && labels[idx]) handleSelectLabel(labels[idx].name);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nextData, prevData, undo, redo, handleSelectLabel, labels, saveSession, showSettings, showAnnotations]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center flex-wrap gap-2">
          <a href="./index.html" className="text-blue-600 dark:text-blue-400 font-bold text-lg hover:text-blue-700 transition-colors">EdgeLabel</a>
          <div className="flex items-center gap-2 flex-wrap">
            <a href="./index.html" className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">← Home</a>
            <select value={theme} onChange={e => setTheme(e.target.value)}
              className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-700 dark:text-white text-sm border border-gray-200 dark:border-gray-600"
              aria-label="Theme">
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <button onClick={() => setShowSettings(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition-colors">
              Settings
            </button>
            <a href="https://coff.ee/clueanalytq" target="_blank" rel="noopener noreferrer"
              className="px-3 py-1.5 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm transition-colors">
              Support Us
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow p-4">
        {showWelcome ? (
          <WelcomeScreen onGetStarted={() => setShowWelcome(false)} />
        ) : (
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4">
            <FileUpload onFileUpload={handleFileUpload} />
            <p className="text-sm text-gray-500 dark:text-gray-400">{fileName || 'No file selected'}</p>

            <FilePreview columnHeaders={columnHeaders} dataItems={dataItems}
              showPreview={showPreview} togglePreview={() => setShowPreview(p => !p)} />

            {dataItems.length > 0 && (
              <>
                {/* Progress */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {progress.count} / {progress.total} annotated
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.pct}%` }} />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(progress.pct)}%</span>
                </div>

                {/* Current item */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 min-h-[80px]">
                  <p className="text-gray-800 dark:text-gray-100 leading-relaxed">
                    {currentIndex === -1
                      ? <span className="text-gray-400 italic">Open Settings and select a column to start annotating.</span>
                      : dataItems[currentIndex]?.[selectedColumn] || <span className="text-gray-400 italic">Empty cell</span>}
                  </p>
                  {currentIndex >= 0 && (
                    <p className="text-xs text-gray-400 mt-2">Row {currentIndex + 1} of {dataItems.length}</p>
                  )}
                </div>

                {/* Labels */}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select a label <span className="text-gray-400 font-normal">(or press 1–{Math.min(labels.length, 9)})</span>
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {labels.map((l, i) => (
                      <button key={l.name}
                        onClick={() => handleSelectLabel(l.name)}
                        disabled={!hasSelectedColumn}
                        className={`${l.color} px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed`}
                        aria-label={`Label as ${l.name} (key ${i + 1})`}>
                        {l.name} <span className="opacity-60 text-xs">({i + 1})</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowCommentField(p => !p)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    {showCommentField ? '− Hide comment' : '+ Add comment'}
                  </button>
                  {showCommentField && (
                    <input type="text" value={tempComment}
                      onChange={e => setTempComment(e.target.value)}
                      placeholder="Optional note for this row…"
                      className="mt-2 w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '← Prev', onClick: prevData, disabled: currentIndex <= 0, cls: 'bg-gray-600 hover:bg-gray-700' },
                    { label: 'Next →', onClick: nextData, disabled: currentIndex >= dataItems.length - 1, cls: 'bg-gray-600 hover:bg-gray-700' },
                    { label: 'Undo', onClick: undo, disabled: !undoStack.length, cls: 'bg-yellow-600 hover:bg-yellow-700' },
                    { label: 'Redo', onClick: redo, disabled: !redoStack.length, cls: 'bg-yellow-600 hover:bg-yellow-700' },
                  ].map(({ label, onClick, disabled, cls }) => (
                    <button key={label} onClick={onClick} disabled={disabled}
                      className={`px-4 py-2 text-white rounded text-sm transition-colors disabled:opacity-40 ${cls}`}>
                      {label}
                    </button>
                  ))}
                  <button onClick={() => setShowAnnotations(true)} disabled={!annotations.some(Boolean)}
                    className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-40 transition-colors">
                    View All
                  </button>
                  <button onClick={() => downloadAnnotations('csv')} disabled={!annotations.some(Boolean)}
                    className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-40 transition-colors">
                    ↓ CSV
                  </button>
                  <button onClick={() => downloadAnnotations('json')} disabled={!annotations.some(Boolean)}
                    className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-40 transition-colors">
                    ↓ JSON
                  </button>
                  <button onClick={() => downloadAnnotations('jsonl')} disabled={!annotations.some(Boolean)}
                    className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-40 transition-colors">
                    ↓ JSONL
                  </button>
                  <button onClick={saveSession}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">
                    Save
                  </button>
                  <button onClick={loadSession}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">
                    Load
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <Footer />

      {/* Modals */}
      <SettingsModal show={showSettings} onClose={() => setShowSettings(false)}
        columnHeaders={columnHeaders} selectedColumn={selectedColumn}
        setSelectedColumn={setSelectedColumn} labels={labels} setLabels={setLabels}
        setHasSelectedColumn={setHasSelectedColumn} />

      <AnnotationsModal show={showAnnotations} onClose={() => setShowAnnotations(false)}
        annotations={annotations} dataItems={dataItems} selectedColumn={selectedColumn} />

      {/* Privacy consent banner */}
      {!privacyConsent && (
        <div className="fixed bottom-0 inset-x-0 bg-gray-900/95 backdrop-blur text-white p-4 flex flex-col sm:flex-row justify-between items-center gap-4 z-[1000]">
          <p className="text-sm text-gray-200 max-w-xl">
            We use optional Google Analytics (anonymous usage statistics only) to improve EdgeLabel.
            Your dataset files <strong>never leave your device</strong>.{' '}
            <a href="./privacy.html" className="underline hover:text-blue-400">Privacy Policy</a>
          </p>
          <div className="flex gap-2">
            <button onClick={() => handlePrivacyConsent(false)}
              className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 text-sm">Decline</button>
            <button onClick={() => handlePrivacyConsent(true)}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-sm font-medium">Accept</button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
