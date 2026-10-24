import { useState, useEffect, useCallback, useMemo } from 'react';
import { parseCSV } from '../shared/csvParser.js';
import { useTheme, savedTheme } from '../shared/theme.js';
import { Toast } from '../shared/Toast.jsx';
import { FileUpload, FilePreview } from '../shared/FileComponents.jsx';
import { Footer } from '../shared/Footer.jsx';

function SettingsModal({ show, onClose, columnHeaders, selectedColumn, setSelectedColumn, setHasSelectedColumn }) {
  const save = () => {
    setSelectedColumn(parseInt(document.getElementById('col-select-t').value));
    setHasSelectedColumn(true);
    onClose();
  };
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Settings</h2>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Column to translate</label>
        <select id="col-select-t" defaultValue={selectedColumn}
          className="w-full p-2 mb-4 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm">
          {columnHeaders.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
        </select>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm">Cancel</button>
          <button onClick={save}    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">Save</button>
        </div>
      </div>
    </div>
  );
}

function TranslationsModal({ show, onClose, translations, dataItems, selectedColumn }) {
  if (!show) return null;
  const done = translations.filter(Boolean);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
          Translations <span className="text-sm font-normal text-gray-500">({done.length} of {dataItems.length})</span>
        </h2>
        <div className="overflow-y-auto flex-1">
          {done.length === 0
            ? <p className="text-sm text-gray-500">No translations yet.</p>
            : (
              <ul className="space-y-2">
                {translations.map((t, i) => t && (
                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300 border-b dark:border-gray-700 pb-1">
                    <span className="text-gray-400 mr-2">#{i + 1}</span>
                    "{dataItems[i]?.[selectedColumn]}" →{' '}
                    <span className="font-medium text-green-600 dark:text-green-400">{t.text}</span>
                    {t.comment && <span className="text-gray-400 ml-2 italic">({t.comment})</span>}
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

export default function App() {
  const [dataItems, setDataItems]           = useState([]);
  const [translations, setTranslations]     = useState([]);
  const [currentIndex, setCurrentIndex]     = useState(0);
  const [fileName, setFileName]             = useState('');
  const [columnHeaders, setColumnHeaders]   = useState([]);
  const [selectedColumn, setSelectedColumn] = useState(0);
  const [theme, setTheme]                   = useState(savedTheme);
  const [showTranslations, setShowTranslations] = useState(false);
  const [showPreview, setShowPreview]       = useState(true);
  const [translationInput, setTranslationInput] = useState('');
  const [showSettings, setShowSettings]     = useState(false);
  const [hasSelectedColumn, setHasSelectedColumn] = useState(false);
  const [undoStack, setUndoStack]           = useState([]);
  const [redoStack, setRedoStack]           = useState([]);
  const [showCommentField, setShowCommentField] = useState(false);
  const [tempComment, setTempComment]       = useState('');
  const [toast, setToast]                   = useState(null);

  const showToast = useCallback((msg, type = 'info') => setToast({ message: msg, type }), []);

  useTheme(theme);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers, data } = parseCSV(e.target.result);
      if (!data.length) { showToast('No valid data found in the CSV.', 'error'); return; }
      setFileName(file.name);
      setColumnHeaders(headers);
      setDataItems(data);
      setTranslations(new Array(data.length).fill(null));
      setCurrentIndex(0);
      setShowPreview(true);
      setHasSelectedColumn(false);
    };
    reader.onerror = () => showToast('Could not read the file.', 'error');
    reader.readAsText(file);
  }, [showToast]);

  const saveTranslation = useCallback((advanceAfter = true) => {
    if (!hasSelectedColumn) { showToast('Please select a column in Settings first.', 'warning'); setShowSettings(true); return; }
    if (currentIndex >= dataItems.length) return;
    setUndoStack(prev => [...prev, { index: currentIndex, translation: translations[currentIndex] }]);
    setRedoStack([]);
    setTranslations(prev => {
      const next = [...prev];
      next[currentIndex] = { text: translationInput, comment: tempComment.trim() || null };
      return next;
    });
    setTranslationInput('');
    setTempComment('');
    if (advanceAfter && currentIndex < dataItems.length - 1) setCurrentIndex(i => i + 1);
  }, [hasSelectedColumn, currentIndex, dataItems.length, translations, translationInput, tempComment, showToast]);

  const nextData = useCallback(() => {
    if (currentIndex < dataItems.length - 1) saveTranslation(true);
  }, [currentIndex, dataItems.length, saveTranslation]);

  const prevData = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (!undoStack.length) return;
    const last = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, { index: currentIndex, translation: translations[currentIndex] }]);
    setTranslations(prev => { const n = [...prev]; n[last.index] = last.translation; return n; });
    setCurrentIndex(last.index);
    setUndoStack(prev => prev.slice(0, -1));
  }, [undoStack, translations, currentIndex]);

  const redo = useCallback(() => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, { index: currentIndex, translation: translations[currentIndex] }]);
    setTranslations(prev => { const n = [...prev]; n[next.index] = next.translation; return n; });
    setCurrentIndex(next.index);
    setRedoStack(prev => prev.slice(0, -1));
  }, [redoStack, translations, currentIndex]);

  const saveSession = useCallback(() => {
    localStorage.setItem('translation_session', JSON.stringify({ dataItems, translations, fileName, columnHeaders, selectedColumn, hasSelectedColumn, showPreview }));
    showToast('Session saved.', 'success');
  }, [dataItems, translations, fileName, columnHeaders, selectedColumn, hasSelectedColumn, showPreview, showToast]);

  const loadSession = useCallback(() => {
    const raw = localStorage.getItem('translation_session');
    if (!raw) { showToast('No saved session found.', 'warning'); return; }
    const s = JSON.parse(raw);
    setDataItems(s.dataItems); setTranslations(s.translations); setFileName(s.fileName);
    setColumnHeaders(s.columnHeaders); setSelectedColumn(s.selectedColumn);
    setHasSelectedColumn(s.hasSelectedColumn); setShowPreview(s.showPreview);
    setCurrentIndex(0);
    showToast('Session loaded.', 'success');
  }, [showToast]);

  const downloadTranslations = useCallback(() => {
    const headers = [...columnHeaders, 'Translation', 'Comment'];
    const rows = [headers.map(h => `"${h}"`).join(',')];
    dataItems.forEach((row, i) => {
      const t = translations[i];
      const cells = [...row, t ? t.text : '', t ? (t.comment || '') : ''];
      rows.push(cells.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `translated_${fileName}`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [dataItems, translations, columnHeaders, fileName]);

  const progress = useMemo(() => {
    const count = translations.filter(Boolean).length;
    return { count, total: dataItems.length, pct: dataItems.length ? (count / dataItems.length) * 100 : 0 };
  }, [translations, dataItems]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center flex-wrap gap-2">
          <a href="./index.html" className="text-green-600 dark:text-green-400 font-bold text-lg hover:text-green-700 transition-colors">EdgeTranslate</a>
          <div className="flex items-center gap-2 flex-wrap">
            <a href="./index.html" className="text-sm text-gray-600 dark:text-gray-300 hover:text-green-600 transition-colors">← Home</a>
            <select value={theme} onChange={e => setTheme(e.target.value)}
              className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-700 dark:text-white text-sm border border-gray-200 dark:border-gray-600"
              aria-label="Theme">
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <button onClick={() => setShowSettings(true)}
              className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition-colors">
              Settings
            </button>
            <a href="https://coff.ee/clueanalytq" target="_blank" rel="noopener noreferrer"
              className="px-3 py-1.5 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm transition-colors">
              Support Us
            </a>
          </div>
        </div>
      </header>

      <main className="flex-grow p-4">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4">
          <FileUpload onFileUpload={handleFileUpload} />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {fileName || 'No file selected'}
            {hasSelectedColumn && columnHeaders[selectedColumn] && (
              <span className="ml-2 text-gray-400">· translating: <strong>{columnHeaders[selectedColumn]}</strong></span>
            )}
          </p>

          <FilePreview columnHeaders={columnHeaders} dataItems={dataItems}
            showPreview={showPreview} togglePreview={() => setShowPreview(p => !p)} />

          {dataItems.length > 0 && (
            <>
              {/* Progress */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {progress.count} / {progress.total} translated
                </span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.pct}%` }} />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(progress.pct)}%</span>
              </div>

              {/* Source text */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 min-h-[72px]">
                <p className="text-gray-800 dark:text-gray-100 leading-relaxed">
                  {hasSelectedColumn
                    ? dataItems[currentIndex]?.[selectedColumn] || <span className="text-gray-400 italic">Empty cell</span>
                    : <span className="text-gray-400 italic">Select a column to translate in Settings.</span>}
                </p>
                {dataItems.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">Row {currentIndex + 1} of {dataItems.length}</p>
                )}
              </div>

              {/* Translation input */}
              <div>
                <textarea
                  value={translationInput}
                  onChange={e => setTranslationInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveTranslation(); }}
                  placeholder="Enter translation… (Ctrl+Enter to save)"
                  disabled={!hasSelectedColumn}
                  rows={3}
                  className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm resize-y disabled:opacity-50"
                />
                <button onClick={() => setShowCommentField(p => !p)}
                  className="mt-1 text-sm text-green-600 dark:text-green-400 hover:underline">
                  {showCommentField ? '− Hide comment' : '+ Add comment'}
                </button>
                {showCommentField && (
                  <input type="text" value={tempComment}
                    onChange={e => setTempComment(e.target.value)}
                    placeholder="Optional note…"
                    className="mt-2 w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button onClick={prevData} disabled={currentIndex <= 0}
                  className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-40 transition-colors">← Prev</button>
                <button onClick={() => saveTranslation(true)} disabled={!hasSelectedColumn}
                  className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-40 transition-colors">Save &amp; Next →</button>
                <button onClick={undo} disabled={!undoStack.length}
                  className="px-4 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:opacity-40 transition-colors">Undo</button>
                <button onClick={redo} disabled={!redoStack.length}
                  className="px-4 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:opacity-40 transition-colors">Redo</button>
                <button onClick={() => setShowTranslations(true)} disabled={!translations.some(Boolean)}
                  className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-40 transition-colors">View All</button>
                <button onClick={downloadTranslations} disabled={!translations.some(Boolean)}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-40 transition-colors">↓ Download CSV</button>
                <button onClick={saveSession}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">Save</button>
                <button onClick={loadSession}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">Load</button>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />

      <SettingsModal show={showSettings} onClose={() => setShowSettings(false)}
        columnHeaders={columnHeaders} selectedColumn={selectedColumn}
        setSelectedColumn={setSelectedColumn} setHasSelectedColumn={setHasSelectedColumn} />

      <TranslationsModal show={showTranslations} onClose={() => setShowTranslations(false)}
        translations={translations} dataItems={dataItems} selectedColumn={selectedColumn} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
