import { useState, useEffect, useCallback, useMemo } from 'react';
import { parseCSV } from '../shared/csvParser.js';
import { useTheme, savedTheme } from '../shared/theme.js';
import { Toast } from '../shared/Toast.jsx';
import { FileUpload, FilePreview } from '../shared/FileComponents.jsx';
import { SuiteSwitcher } from '../shared/SuiteSwitcher.jsx';
import { ExportModal } from '../shared/ExportModal.jsx';
import { DatasetQualityModal } from '../shared/DatasetQualityModal.jsx';
import { AgreementResolverModal } from '../shared/AgreementResolver.jsx';
import { SchemaConfigModal } from '../shared/SchemaConfigModal.jsx';
import { NERAnnotator, DEFAULT_ENTITY_TYPES } from '../shared/NERAnnotator.jsx';
import { HeuristicRulesModal } from '../shared/HeuristicRulesModal.jsx';
import { PWAInstallButton, OfflineIndicator } from '../shared/PWAInstallButton.jsx';
import { auditLogger } from '../shared/AuditTrail.js';

// ─── Analytics (consent-gated) ───────────────────────────────────────────────
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

// ─── Constants ────────────────────────────────────────────────────────────────
const LABEL_COLOURS = [
  'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700',
  'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700',
  'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
  'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700',
  'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700',
  'bg-teal-100 text-teal-800 border border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-700',
  'bg-pink-100 text-pink-800 border border-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:border-pink-700',
  'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700',
  'bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700',
];

const DEFAULT_LABELS = [
  { name: 'Positive', colour: LABEL_COLOURS[1] },
  { name: 'Neutral',  colour: LABEL_COLOURS[0] },
  { name: 'Negative', colour: LABEL_COLOURS[2] },
  { name: 'Others',   colour: LABEL_COLOURS[3] },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Modal({ show, onClose, title, children, wide }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

function WelcomeScreen({ onGetStarted, onLoadSampleMedical }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-lg w-full text-center">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/40 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">EdgeLabel Studio</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          Row classification, named entity recognition (NER), and local heuristic rules. 100% in-browser memory.
        </p>
        <ul className="text-left inline-block text-sm text-gray-500 dark:text-gray-400 mb-8 space-y-2">
          {[
            'Upload a UTF-8 CSV file or load sample datasets',
            'Switch between Text Classification & NER Span Tagging',
            'Pre-label thousands of rows with local Heuristic Regex rules',
            'Export to SpaCy v3, CoNLL-2003 IOB2, Hugging Face, or ChatML',
          ].map((s, i) => (
            <li key={i} className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              {s}
            </li>
          ))}
        </ul>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={onGetStarted} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 text-base">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            Upload CSV
          </button>
          <button onClick={onLoadSampleMedical} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-base border border-gray-200 dark:border-gray-700">
            <span>✨ Try Medical NER Sample</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsModal({ show, onClose, columnHeaders, selectedColumn, setSelectedColumn, labels, setLabels, setHasSelectedColumn }) {
  const [tempLabels, setTempLabels] = useState(labels);
  const [newLabel, setNewLabel] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { if (show) { setTempLabels(labels); setError(''); } }, [show, labels]);

  const addLabel = () => {
    const t = newLabel.trim();
    if (!t || tempLabels.some(l => l.name.toLowerCase() === t.toLowerCase())) {
      setError('Label name must be non-empty and unique.');
      return;
    }
    setTempLabels(prev => [...prev, { name: t, colour: LABEL_COLOURS[prev.length % LABEL_COLOURS.length] }]);
    setNewLabel('');
    setError('');
  };

  const save = () => {
    if (!tempLabels.length) { setError('At least one label is required.'); return; }
    setLabels(tempLabels);
    setSelectedColumn(parseInt(document.getElementById('col-sel').value));
    setHasSelectedColumn(true);
    onClose();
  };

  return (
    <Modal show={show} onClose={onClose} title="Settings">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Column to annotate</label>
          <select id="col-sel" defaultValue={selectedColumn}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
            {columnHeaders.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Classification Labels</label>
          <div className="space-y-2 max-h-44 overflow-y-auto mb-3 pr-1">
            {tempLabels.map((l, i) => (
              <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${l.colour}`}>{l.name}</span>
                <button onClick={() => setTempLabels(p => p.filter((_, j) => j !== i))}
                  className="text-gray-400 hover:text-red-500 transition-colors text-xs font-medium">Remove</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addLabel()}
              placeholder="New label name…"
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"/>
            <button onClick={addLabel} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">Add</button>
          </div>
          {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
        <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">Cancel</button>
        <button onClick={save} className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">Save settings</button>
      </div>
    </Modal>
  );
}

function AnnotationsModal({ show, onClose, annotations, dataItems, selectedColumn, annotationMode }) {
  const annotated = annotations.filter((a) => a && (a.label || (a.spans && a.spans.length > 0)));
  return (
    <Modal show={show} onClose={onClose} title={`Annotations (${annotated.length} / ${dataItems.length})`} wide>
      {annotated.length === 0
        ? <p className="text-sm text-gray-400 text-center py-8">No annotations yet.</p>
        : (
          <ul className="space-y-2">
            {annotations.map((a, i) => a && (
              <li key={i} className="flex items-start gap-3 text-sm py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <span className="text-gray-400 font-mono w-8 shrink-0 pt-0.5">#{i+1}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-gray-600 dark:text-gray-300 block truncate" title={dataItems[i]?.[selectedColumn]}>
                    {dataItems[i]?.[selectedColumn]}
                  </span>
                  {a.spans && a.spans.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {a.spans.map((sp, sIdx) => (
                        <span key={sIdx} className={`text-[10px] font-semibold px-2 py-0.5 rounded ${sp.colour || 'bg-blue-100 text-blue-800'}`}>
                          "{sp.text}" → {sp.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {a.label && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${a.colour || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}>
                    {a.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
    </Modal>
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
  const [entityTypes, setEntityTypes]       = useState(DEFAULT_ENTITY_TYPES);
  const [annotationMode, setAnnotationMode] = useState('classification'); // 'classification' | 'ner'
  const [theme, setTheme]                   = useState(savedTheme);
  const [showSettings, setShowSettings]     = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [showHeuristicsModal, setShowHeuristicsModal] = useState(false);
  const [schemaConfig, setSchemaConfig] = useState({
    guidelines: 'Carefully read the text and apply the most accurate label or entity tags.',
    minLength: 1,
    maxLength: 3000,
    requireCommentForLabels: [],
    allowMultipleLabels: false,
  });
  const [privacyConsent, setPrivacyConsent] = useState(localStorage.getItem('privacyConsent') === 'true');
  const [undoStack, setUndoStack]           = useState([]);
  const [redoStack, setRedoStack]           = useState([]);
  const [showWelcome, setShowWelcome]       = useState(true);
  const [showCommentField, setShowCommentField] = useState(false);
  const [tempComment, setTempComment]       = useState('');
  const [hasSelectedColumn, setHasSelectedColumn] = useState(false);
  const [showPreview, setShowPreview]       = useState(false);
  const [toast, setToast]                   = useState(null);

  const showToast = useCallback((msg, type = 'info') => setToast({ message: msg, type }), []);
  useTheme(theme);

  useEffect(() => {
    if (!fileName || !annotations.length) return;
    const t = setInterval(() => localStorage.setItem(`annotations_${fileName}`, JSON.stringify(annotations)), 5000);
    return () => clearInterval(t);
  }, [annotations, fileName]);

  useEffect(() => {
    if (!fileName) return;
    const s = localStorage.getItem(`annotations_${fileName}`);
    if (s) setAnnotations(JSON.parse(s));
  }, [fileName]);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers, data } = parseCSV(e.target.result);
      if (!data.length) { showToast('No valid data found. Check the CSV has at least one data row.', 'error'); return; }
      setFileName(file.name);
      setColumnHeaders(headers);
      setDataItems(data);
      setAnnotations(new Array(data.length).fill(null));
      setCurrentIndex(0);
      setShowWelcome(false);
      setShowPreview(false);
      setHasSelectedColumn(true);
      setSelectedColumn(0);
      setShowCommentField(false);
      setTempComment('');

      // Auto-detect NER from filename or headers
      if (file.name.toLowerCase().includes('ner') || headers.some(h => /sentence|text|domain/i.test(h))) {
        setAnnotationMode('ner');
        showToast('Switched to NER / Entity Spans mode for this dataset.', 'info');
      }

      localStorage.removeItem(`annotations_${file.name}`);
      auditLogger.log('FILE_LOADED', { fileName: file.name, rowCount: data.length });
      if (!window.disableAnalytics) gtag('event', 'upload_csv', { event_category: 'File', value: data.length });
    };
    reader.onerror = () => showToast('Could not read the file.', 'error');
    reader.readAsText(file);
  }, [showToast]);

  const loadSampleMedicalNER = useCallback(async () => {
    try {
      const res = await fetch('./samples/medical-ner.csv');
      const text = await res.text();
      const { headers, data } = parseCSV(text);
      if (data.length) {
        setFileName('medical-ner.csv');
        setColumnHeaders(headers);
        setDataItems(data);
        setAnnotations(new Array(data.length).fill(null));
        setCurrentIndex(0);
        setShowWelcome(false);
        setHasSelectedColumn(true);
        setSelectedColumn(0);
        setAnnotationMode('ner');
        showToast('Loaded Medical NER sample with clinical entities!', 'success');
        auditLogger.log('SAMPLE_LOADED', { sample: 'medical-ner.csv', rowCount: data.length });
      }
    } catch {
      showToast('Could not load sample file.', 'error');
    }
  }, [showToast]);

  const saveAnnotation = useCallback((label, colour) => {
    if (currentIndex < 0) { setCurrentIndex(0); return; }
    if (currentIndex >= dataItems.length) return;
    setUndoStack(p => [...p, { index: currentIndex, annotation: annotations[currentIndex] }]);
    setRedoStack([]);
    const commentVal = tempComment.trim() || null;
    setAnnotations(p => { const n=[...p]; n[currentIndex]={ ...(n[currentIndex] || {}), label, colour, comment: commentVal }; return n; });
    auditLogger.log('LABEL_APPLIED', {
      rowIndex: currentIndex,
      label,
      comment: commentVal,
      text: dataItems[currentIndex]?.[selectedColumn],
    });
    setTempComment('');
    if (currentIndex < dataItems.length - 1) setCurrentIndex(i => i + 1);
  }, [currentIndex, annotations, dataItems, selectedColumn, tempComment]);

  const handleUpdateSpans = useCallback((newSpans) => {
    if (currentIndex < 0 || currentIndex >= dataItems.length) return;
    setUndoStack(p => [...p, { index: currentIndex, annotation: annotations[currentIndex] }]);
    setRedoStack([]);
    setAnnotations(p => {
      const n = [...p];
      n[currentIndex] = {
        ...(n[currentIndex] || {}),
        spans: newSpans,
        hasSpans: newSpans.length > 0,
      };
      return n;
    });
    auditLogger.log('NER_SPANS_UPDATED', {
      rowIndex: currentIndex,
      spansCount: newSpans.length,
      text: dataItems[currentIndex]?.[selectedColumn],
    });
  }, [currentIndex, dataItems, selectedColumn, annotations]);

  const handleSelectLabel = useCallback((label, colour) => {
    if (!hasSelectedColumn) { showToast('Select a column in Settings first.', 'warning'); setShowSettings(true); return; }
    if (schemaConfig.requireCommentForLabels.includes(label) && !tempComment.trim()) {
      showToast(`Comment required for "${label}" under schema rules.`, 'warning');
      setShowCommentField(true);
      return;
    }
    saveAnnotation(label, colour);
  }, [hasSelectedColumn, schemaConfig, tempComment, saveAnnotation, showToast]);

  const handleDeduplicate = useCallback(() => {
    if (!dataItems.length) return;
    const seen = new Set();
    const newItems = [];
    const newAnns = [];
    let dupsRemoved = 0;

    dataItems.forEach((row, idx) => {
      const text = (row[selectedColumn] || '').trim().toLowerCase();
      if (!seen.has(text)) {
        seen.add(text);
        newItems.push(row);
        newAnns.push(annotations[idx]);
      } else {
        dupsRemoved++;
      }
    });

    setDataItems(newItems);
    setAnnotations(newAnns);
    setCurrentIndex(0);
    showToast(`Deduplication complete: removed ${dupsRemoved} duplicate rows!`, 'success');
    auditLogger.log('DATASET_DEDUPLICATED', { removedCount: dupsRemoved });
  }, [dataItems, annotations, selectedColumn, showToast]);

  const nextData = useCallback(() => {
    if (!hasSelectedColumn) { showToast('Select a column in Settings first.', 'warning'); setShowSettings(true); return; }
    if (currentIndex < dataItems.length - 1) setCurrentIndex(i => i + 1);
  }, [currentIndex, dataItems.length, hasSelectedColumn, showToast]);

  const prevData = useCallback(() => { if (currentIndex > 0) setCurrentIndex(i => i - 1); }, [currentIndex]);

  const undo = useCallback(() => {
    if (!undoStack.length) return;
    const last = undoStack[undoStack.length - 1];
    setRedoStack(p => [...p, { index: currentIndex, annotation: annotations[currentIndex] }]);
    setAnnotations(p => { const n=[...p]; n[last.index]=last.annotation; return n; });
    setCurrentIndex(last.index);
    setUndoStack(p => p.slice(0, -1));
  }, [undoStack, annotations, currentIndex]);

  const redo = useCallback(() => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(p => [...p, { index: currentIndex, annotation: annotations[currentIndex] }]);
    setAnnotations(p => { const n=[...p]; n[next.index]=next.annotation; return n; });
    setCurrentIndex(next.index);
    setRedoStack(p => p.slice(0, -1));
  }, [redoStack, annotations, currentIndex]);

  const downloadAnnotations = useCallback((format = 'csv') => {
    let content, mime, ext;
    if (format === 'json') {
      content = JSON.stringify(annotations.map((a,i) => a && ({
        data: dataItems[i][selectedColumn],
        label: a.label,
        spans: a.spans || [],
        comment: a.comment||null
      })).filter(Boolean), null, 2);
      mime = 'application/json'; ext = 'json';
    } else if (format === 'jsonl') {
      content = annotations.map((a,i) => a && JSON.stringify({
        data: dataItems[i][selectedColumn],
        label: a.label,
        spans: a.spans || [],
        comment: a.comment||null
      })).filter(Boolean).join('\n');
      mime = 'application/jsonlines'; ext = 'jsonl';
    } else {
      const rows = ['"Data","Label","Entities_JSON","Comment"'];
      dataItems.forEach((row,i) => {
        if (!annotations[i]) return;
        const spansJson = annotations[i].spans ? JSON.stringify(annotations[i].spans).replace(/"/g, '""') : '';
        rows.push(`"${(row[selectedColumn]||'').replace(/"/g,'""')}","${annotations[i].label || ''}","${spansJson}","${(annotations[i].comment||'').replace(/"/g,'""')}"`);
      });
      content = rows.join('\n'); mime = 'text/csv;charset=utf-8;'; ext = 'csv';
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = `annotations_${fileName}.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
    if (!window.disableAnalytics) gtag('event', `download_${format}`, { event_category: 'File' });
  }, [dataItems, annotations, selectedColumn, fileName]);

  const saveSession = useCallback(() => {
    localStorage.setItem('saved_session', JSON.stringify({
      dataItems, annotations, fileName, columnHeaders, selectedColumn, labels, entityTypes, annotationMode, hasSelectedColumn, showPreview
    }));
    showToast('Session saved to local storage.', 'success');
  }, [dataItems, annotations, fileName, columnHeaders, selectedColumn, labels, entityTypes, annotationMode, hasSelectedColumn, showPreview, showToast]);

  const loadSession = useCallback(() => {
    const raw = localStorage.getItem('saved_session');
    if (!raw) { showToast('No saved session found.', 'warning'); return; }
    const s = JSON.parse(raw);
    setDataItems(s.dataItems); setAnnotations(s.annotations); setFileName(s.fileName);
    setColumnHeaders(s.columnHeaders); setSelectedColumn(s.selectedColumn); setLabels(s.labels);
    if (s.entityTypes) setEntityTypes(s.entityTypes);
    if (s.annotationMode) setAnnotationMode(s.annotationMode);
    setHasSelectedColumn(s.hasSelectedColumn); setShowPreview(s.showPreview);
    setCurrentIndex(s.hasSelectedColumn ? 0 : -1);
    setShowWelcome(false);
    showToast('Session loaded successfully.', 'success');
  }, [showToast]);

  const handlePrivacyConsent = (accepted) => {
    setPrivacyConsent(accepted);
    localStorage.setItem('privacyConsent', String(accepted));
    if (accepted) { loadGA(); gtag('event', 'accept_privacy', { event_category: 'Privacy' }); }
  };

  const progress = useMemo(() => {
    const count = annotations.filter((a) => a && (a.label || (a.spans && a.spans.length > 0))).length;
    return { count, total: dataItems.length, pct: dataItems.length ? (count / dataItems.length) * 100 : 0 };
  }, [annotations, dataItems]);

  const currentAnnotation = annotations[currentIndex];

  useEffect(() => {
    const onKey = (e) => {
      if (showSettings || showAnnotations || showExportModal || showQualityModal || showAgreementModal || showSchemaModal || showHeuristicsModal) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight') nextData();
      if (e.key === 'ArrowLeft') prevData();
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveSession(); }

      if (annotationMode === 'classification') {
        const idx = parseInt(e.key) - 1;
        if (!isNaN(idx) && idx >= 0 && labels[idx]) handleSelectLabel(labels[idx].name, labels[idx].colour);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nextData, prevData, undo, redo, handleSelectLabel, labels, saveSession, showSettings, showAnnotations, showExportModal, showQualityModal, showAgreementModal, showSchemaModal, showHeuristicsModal, annotationMode]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <OfflineIndicator />

      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <a href="./index.html" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-lg">
              <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#2563eb"/><path d="M8 10a2 2 0 0 1 2-2h6.586a2 2 0 0 1 1.414.586l5.828 5.828a2 2 0 0 1 0 2.828l-5.172 5.172a2 2 0 0 1-2.828 0L10.586 17.4A2 2 0 0 1 10 16V10z" fill="white"/><circle cx="13" cy="13" r="1.5" fill="#2563eb"/></svg>
              <span className="hidden sm:inline">EdgeLabel</span>
            </a>
            <SuiteSwitcher activeProductId="edgelabel" />

            {/* Mode Switcher Pill */}
            {dataItems.length > 0 && (
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700 ml-1">
                <button
                  onClick={() => setAnnotationMode('classification')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                    annotationMode === 'classification'
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  🏷️ Classification
                </button>
                <button
                  onClick={() => setAnnotationMode('ner')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1 ${
                    annotationMode === 'ner'
                      ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  ✨ Entity / Spans (NER)
                </button>
              </div>
            )}
          </div>

          {fileName && (
            <div className="flex-1 min-w-0 hidden md:flex items-center gap-3">
              <span className="text-xs text-gray-400 truncate">{fileName}</span>
              {hasSelectedColumn && <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">{columnHeaders[selectedColumn]}</span>}
            </div>
          )}

          <div className="flex items-center gap-2">
            {dataItems.length > 0 && (
              <>
                <button
                  onClick={() => setShowHeuristicsModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                  title="Bulk Pre-Labeling using Regex & Heuristics"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <span>Rules & Regex</span>
                </button>

                <button
                  onClick={() => setShowQualityModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors hidden sm:flex"
                  title="Run Dataset Quality & Health Audit"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>QA Audit</span>
                </button>

                <button
                  onClick={() => setShowAgreementModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors hidden lg:flex"
                  title="Inter-Annotator Agreement (Cohen's Kappa)"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Agreement</span>
                </button>

                <button
                  onClick={() => setShowSchemaModal(true)}
                  className="px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors hidden xl:block"
                  title="Configure schema validation rules"
                >
                  Schema
                </button>
              </>
            )}

            <PWAInstallButton compact />

            <select value={theme} onChange={e => setTheme(e.target.value)} aria-label="Theme"
              className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 outline-none">
              <option value="system">Auto</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <button onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow">
        {showWelcome ? (
          <WelcomeScreen
            onGetStarted={() => setShowWelcome(false)}
            onLoadSampleMedical={loadSampleMedicalNER}
          />
        ) : (
          <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
            {/* Upload + preview */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <FileUpload onFileUpload={handleFileUpload} />
              <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                {fileName && <p className="text-xs text-gray-400 font-medium">Active File: <strong className="text-gray-700 dark:text-gray-200">{fileName}</strong></p>}
                {!fileName && (
                  <button onClick={loadSampleMedicalNER} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                    ✨ Load Medical NER Dataset Sample
                  </button>
                )}
              </div>
              <FilePreview columnHeaders={columnHeaders} dataItems={dataItems} showPreview={showPreview} togglePreview={() => setShowPreview(p => !p)} />
            </div>

            {dataItems.length > 0 && (
              <>
                {/* Progress bar */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {progress.count} <span className="font-normal text-gray-400">of</span> {progress.total} annotated
                      <span className="ml-2 text-xs font-normal text-gray-400">({annotationMode === 'ner' ? 'NER Spans Mode' : 'Classification Mode'})</span>
                    </span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{Math.round(progress.pct)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress.pct}%` }}/>
                  </div>
                </div>

                {/* Main annotation workspace: NER vs Classification */}
                {annotationMode === 'ner' ? (
                  /* ─── NER / Span Workspace ───────────────────────────────────── */
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider bg-purple-50 dark:bg-purple-900/30 px-2.5 py-1 rounded-md">
                          Entity / Spans Mode (NER)
                        </span>
                        <span className="text-xs font-semibold text-gray-400">
                          {currentIndex >= 0 ? `Sentence ${currentIndex + 1} of ${dataItems.length}` : 'Ready'}
                        </span>
                      </div>
                      {currentAnnotation?.spans?.length > 0 && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                          ✓ {currentAnnotation.spans.length} entities tagged
                        </span>
                      )}
                    </div>

                    {/* NER Interactive Highlighter */}
                    <NERAnnotator
                      text={dataItems[currentIndex]?.[selectedColumn] || ''}
                      spans={currentAnnotation?.spans || []}
                      onUpdateSpans={handleUpdateSpans}
                      entityTypes={entityTypes}
                      onAddEntityType={(newEt) => setEntityTypes(p => [...p, newEt])}
                      onToast={showToast}
                    />

                    {/* Navigation and undo/redo */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-50 dark:border-gray-800">
                      <button onClick={prevData} disabled={currentIndex <= 0}
                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg> Prev (←)
                      </button>
                      <button onClick={nextData} disabled={currentIndex >= dataItems.length - 1}
                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 transition-colors">
                        Next (→) <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                      </button>
                      <div className="flex-1"/>
                      <button onClick={undo} disabled={!undoStack.length} title="Undo (Ctrl+Z)"
                        className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 transition-colors font-mono">↩ Undo</button>
                      <button onClick={redo} disabled={!redoStack.length} title="Redo (Ctrl+Y)"
                        className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 transition-colors font-mono">↪ Redo</button>
                    </div>
                  </div>
                ) : (
                  /* ─── Classification Workspace ───────────────────────────────── */
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {/* Current item */}
                    <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {currentIndex >= 0 ? `Row ${currentIndex + 1} of ${dataItems.length}` : 'Ready'}
                        </span>
                        {currentAnnotation?.label && (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${currentAnnotation.colour || 'bg-gray-100 text-gray-600'}`}>
                            ✓ {currentAnnotation.label}
                          </span>
                        )}
                      </div>

                      <div className="min-h-[100px] flex items-start">
                        {currentIndex === -1 || !hasSelectedColumn ? (
                          <p className="text-gray-400 italic text-sm">Open Settings and select a column to begin.</p>
                        ) : (
                          <p className="text-gray-800 dark:text-gray-100 leading-relaxed text-base">
                            {dataItems[currentIndex]?.[selectedColumn] || <span className="text-gray-300 italic">Empty cell</span>}
                          </p>
                        )}
                      </div>

                      {/* Navigation */}
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-50 dark:border-gray-800">
                        <button onClick={prevData} disabled={currentIndex <= 0}
                          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg> Prev
                        </button>
                        <button onClick={nextData} disabled={currentIndex >= dataItems.length - 1}
                          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 transition-colors">
                          Next <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                        </button>
                        <div className="flex-1"/>
                        <button onClick={undo} disabled={!undoStack.length} title="Undo (Ctrl+Z)"
                          className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 transition-colors font-mono">↩</button>
                        <button onClick={redo} disabled={!redoStack.length} title="Redo (Ctrl+Y)"
                          className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 transition-colors font-mono">↪</button>
                      </div>
                    </div>

                    {/* Label panel */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm flex flex-col gap-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Labels <span className="font-normal normal-case">(press 1–{Math.min(labels.length,9)})</span></p>
                      <div className="flex flex-col gap-2">
                        {labels.map((l, i) => (
                          <button key={l.name} onClick={() => handleSelectLabel(l.name, l.colour)}
                            disabled={!hasSelectedColumn}
                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${l.colour}`}>
                            <span>{l.name}</span>
                            <span className="opacity-50 font-normal text-xs">{i+1}</span>
                          </button>
                        ))}
                      </div>

                      {/* Comment toggle */}
                      <button onClick={() => setShowCommentField(p => !p)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline text-left">
                        {showCommentField ? '− Hide comment' : '+ Add a comment'}
                      </button>
                      {showCommentField && (
                        <input type="text" value={tempComment} onChange={e => setTempComment(e.target.value)}
                          placeholder="Optional note for this row…"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500"/>
                      )}
                    </div>
                  </div>
                )}

                {/* Action toolbar */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      onClick={() => setShowExportModal(true)}
                      disabled={!annotations.some(a => a && (a.label || (a.spans && a.spans.length > 0)))}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all disabled:opacity-40 flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export Dataset (SpaCy / LLM / HF)
                    </button>
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"/>
                    {[['CSV', 'csv'], ['JSON', 'json'], ['JSONL', 'jsonl']].map(([label, fmt]) => (
                      <button key={fmt} onClick={() => downloadAnnotations(fmt)} disabled={!annotations.some(Boolean)}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors">
                        ↓ {label}
                      </button>
                    ))}
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"/>
                    <button onClick={() => setShowAnnotations(true)} disabled={!annotations.some(Boolean)}
                      className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-40 transition-colors">
                      View All
                    </button>
                    <div className="flex-1"/>
                    <button
                      onClick={() => {
                        auditLogger.exportAuditJson(fileName);
                        showToast('Exported regulatory audit trail (.json)', 'success');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors border border-gray-200 dark:border-gray-700 flex items-center gap-1.5"
                      title="Export HIPAA / GDPR Compliance Audit Trail"
                    >
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Audit Trail
                    </button>
                    <button onClick={saveSession} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors border border-gray-200 dark:border-gray-700">
                      Save
                    </button>
                    <button onClick={loadSession} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors border border-gray-200 dark:border-gray-700">
                      Load
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 py-4 px-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
          <span>© 2025 <a href="https://clue-analytics.web.app/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500">Cueligence</a> — EdgeLabel</span>
          <nav className="flex gap-4">
            {[['Security Architecture', './security-architecture.html'], ['Privacy Policy','./privacy.html'],['User Guide','./guide.html'],['About','./about.html']].map(([l,h]) => (
              <a key={l} href={h} className="hover:text-blue-500 transition-colors">{l}</a>
            ))}
          </nav>
        </div>
      </footer>

      {/* Modals */}
      <SettingsModal show={showSettings} onClose={() => setShowSettings(false)}
        columnHeaders={columnHeaders} selectedColumn={selectedColumn}
        setSelectedColumn={setSelectedColumn} labels={labels} setLabels={setLabels}
        setHasSelectedColumn={setHasSelectedColumn}/>
      <AnnotationsModal show={showAnnotations} onClose={() => setShowAnnotations(false)}
        annotations={annotations} dataItems={dataItems} selectedColumn={selectedColumn} annotationMode={annotationMode}/>
      <ExportModal show={showExportModal} onClose={() => setShowExportModal(false)}
        dataItems={dataItems} annotations={annotations} selectedColumn={selectedColumn}
        columnHeaders={columnHeaders} labelsList={labels} fileName={fileName}
        annotationMode={annotationMode} onToast={showToast}/>
      <HeuristicRulesModal
        show={showHeuristicsModal}
        onClose={() => setShowHeuristicsModal(false)}
        dataItems={dataItems}
        selectedColumn={selectedColumn}
        currentAnnotations={annotations}
        annotationMode={annotationMode}
        onApplyRules={(updated) => {
          setAnnotations(updated);
          auditLogger.log('HEURISTICS_APPLIED', { mode: annotationMode, count: updated.filter(Boolean).length });
        }}
        onToast={showToast}
      />
      <DatasetQualityModal
        show={showQualityModal}
        onClose={() => setShowQualityModal(false)}
        dataItems={dataItems}
        annotations={annotations}
        selectedColumn={selectedColumn}
        columnHeaders={columnHeaders}
        fileName={fileName}
        onSelectRow={(idx) => setCurrentIndex(idx)}
        onDeduplicate={handleDeduplicate}
        onToast={showToast}
      />
      <AgreementResolverModal
        show={showAgreementModal}
        onClose={() => setShowAgreementModal(false)}
        dataItems={dataItems}
        currentAnnotations={annotations}
        selectedColumn={selectedColumn}
        labelsList={labels}
        onApplyAdjudicated={(updated) => {
          setAnnotations(updated);
          auditLogger.log('DISAGREEMENTS_ADJUDICATED', { count: updated.filter(Boolean).length });
        }}
        onToast={showToast}
      />
      <SchemaConfigModal
        show={showSchemaModal}
        onClose={() => setShowSchemaModal(false)}
        schemaConfig={schemaConfig}
        onSaveSchema={(newCfg) => {
          setSchemaConfig(newCfg);
          auditLogger.log('SCHEMA_UPDATED', newCfg);
        }}
        labelsList={labels}
        onToast={showToast}
      />

      {/* Privacy consent */}
      {!privacyConsent && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-4">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-300 leading-relaxed">
              Optional Google Analytics (anonymous usage stats only). Your dataset files <strong className="text-white">never leave your device</strong>.{' '}
              <a href="./privacy.html" className="text-blue-400 hover:underline">Privacy Policy</a>
            </p>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handlePrivacyConsent(false)} className="px-4 py-2 text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">Decline</button>
              <button onClick={() => handlePrivacyConsent(true)} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors">Accept</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}
    </div>
  );
}
