import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

export const DEFAULT_ENTITY_TYPES = [
  { name: 'MEDICATION', colour: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-700', key: '1' },
  { name: 'SYMPTOM',    colour: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/60 dark:text-red-200 dark:border-red-700',       key: '2' },
  { name: 'DOSAGE',     colour: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-700',     key: '3' },
  { name: 'ANATOMY',    colour: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/60 dark:text-purple-200 dark:border-purple-700', key: '4' },
  { name: 'DURATION',   colour: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700',   key: '5' },
  { name: 'PERSON',     colour: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/60 dark:text-indigo-200 dark:border-indigo-700', key: '6' },
];

export function NERAnnotator({
  text = '',
  spans = [],
  onUpdateSpans,
  entityTypes = DEFAULT_ENTITY_TYPES,
  onAddEntityType,
  onRemoveEntityType,
  onToast,
}) {
  const containerRef = useRef(null);
  const [activeSelection, setActiveSelection] = useState(null); // { start, end, text }
  const [selectedSpanIndex, setSelectedSpanIndex] = useState(null);
  const [newEntityName, setNewEntityName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Clear selection on row text change
  useEffect(() => {
    setActiveSelection(null);
    setSelectedSpanIndex(null);
  }, [text]);

  // Handle browser mouse text selection
  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;

    const range = sel.getRangeAt(0);
    const container = containerRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) return;

    // Calculate exact start & end indices relative to container raw text
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(container);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;
    const selectedText = range.toString().trim();

    if (!selectedText) {
      sel.removeAllRanges();
      return;
    }

    // Match exact position in target text
    const actualStart = text.indexOf(selectedText, Math.max(0, start - 5));
    const effectiveStart = actualStart !== -1 ? actualStart : start;
    const effectiveEnd = effectiveStart + selectedText.length;

    // Validate that selection doesn't overlap existing span partially
    const overlapping = spans.find((s) => Math.max(s.start, effectiveStart) < Math.min(s.end, effectiveEnd));
    if (overlapping) {
      if (onToast) onToast(`Overlaps with existing span "${overlapping.text}" [${overlapping.label}]`, 'warning');
      sel.removeAllRanges();
      return;
    }

    setActiveSelection({
      start: effectiveStart,
      end: effectiveEnd,
      text: selectedText,
    });
  };

  const applyEntityLabel = useCallback((entityType) => {
    if (!activeSelection) return;

    const newSpan = {
      start: activeSelection.start,
      end: activeSelection.end,
      text: activeSelection.text,
      label: entityType.name,
      colour: entityType.colour,
    };

    const nextSpans = [...spans, newSpan].sort((a, b) => a.start - b.start);
    onUpdateSpans(nextSpans);
    setActiveSelection(null);
    if (window.getSelection) window.getSelection().removeAllRanges();
    if (onToast) onToast(`Tagged "${newSpan.text}" as ${newSpan.label}`, 'success');
  }, [activeSelection, spans, onUpdateSpans, onToast]);

  const removeSpan = (idxToRemove) => {
    const nextSpans = spans.filter((_, idx) => idx !== idxToRemove);
    onUpdateSpans(nextSpans);
    if (selectedSpanIndex === idxToRemove) setSelectedSpanIndex(null);
    if (onToast) onToast('Span removed.', 'info');
  };

  const clearAllSpans = () => {
    if (!spans.length) return;
    onUpdateSpans([]);
    setActiveSelection(null);
    if (onToast) onToast('Cleared all spans for this row.', 'info');
  };

  // Keyboard shortcut listener for active selection
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!activeSelection) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key;
      const matched = entityTypes.find((et) => et.key === key);
      if (matched) {
        e.preventDefault();
        applyEntityLabel(matched);
      } else if (e.key === 'Escape') {
        setActiveSelection(null);
        if (window.getSelection) window.getSelection().removeAllRanges();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSelection, entityTypes, applyEntityLabel]);

  // Break text into segments: [plainText, span, plainText, ...]
  const renderedSegments = useMemo(() => {
    if (!text) return [];
    if (!spans || !spans.length) {
      return [{ type: 'text', content: text }];
    }

    const sorted = [...spans].sort((a, b) => a.start - b.start);
    const segments = [];
    let lastIdx = 0;

    sorted.forEach((span, i) => {
      if (span.start > lastIdx) {
        segments.push({
          type: 'text',
          content: text.slice(lastIdx, span.start),
        });
      }
      segments.push({
        type: 'span',
        spanIndex: i,
        ...span,
      });
      lastIdx = span.end;
    });

    if (lastIdx < text.length) {
      segments.push({
        type: 'text',
        content: text.slice(lastIdx),
      });
    }

    return segments;
  }, [text, spans]);

  return (
    <div className="space-y-4">
      {/* Active Selection Floating Prompt */}
      {activeSelection && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-800 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Selected:</span>
            <span className="font-mono text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-700 font-bold text-gray-900 dark:text-white">
              "{activeSelection.text}"
            </span>
            <span className="text-xs text-gray-400">({activeSelection.start}–{activeSelection.end})</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Press 1–{entityTypes.length} or click:</span>
            {entityTypes.map((et) => (
              <button
                key={et.name}
                onClick={() => applyEntityLabel(et)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition shadow-xs hover:scale-105 active:scale-95 ${et.colour}`}
                title={`Shortcut: ${et.key}`}
              >
                <span className="mr-1 opacity-70 font-mono">[{et.key}]</span>
                {et.name}
              </button>
            ))}
            <button
              onClick={() => {
                setActiveSelection(null);
                if (window.getSelection) window.getSelection().removeAllRanges();
              }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-2 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Text Display with Interactive Highlighting */}
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className="min-h-[120px] p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs text-base leading-loose select-text cursor-text"
        title="Highlight text with mouse to tag an entity span"
      >
        {renderedSegments.length === 0 ? (
          <span className="text-gray-400 italic">No text in current row.</span>
        ) : (
          renderedSegments.map((seg, idx) => {
            if (seg.type === 'text') {
              return <span key={idx} className="text-gray-800 dark:text-gray-100">{seg.content}</span>;
            }

            // Tagged Span badge
            return (
              <span
                key={idx}
                className={`inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 rounded-lg border text-xs font-semibold tracking-wide transition-all shadow-xs ${seg.colour} group`}
              >
                <span>{seg.text}</span>
                <span className="text-[10px] uppercase font-bold opacity-75 px-1 py-0.2 bg-black/10 dark:bg-white/10 rounded">
                  {seg.label}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSpan(seg.spanIndex);
                  }}
                  className="opacity-60 hover:opacity-100 hover:text-red-600 transition-opacity p-0.5 rounded"
                  title="Remove this entity tag"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Drag across text to select entity spans · Press keys 1–{entityTypes.length} to assign
        </span>
        {spans.length > 0 && (
          <button
            onClick={clearAllSpans}
            className="text-red-500 hover:text-red-600 hover:underline font-medium"
          >
            Clear all ({spans.length})
          </button>
        )}
      </div>

      {/* Row Spans Table / Badges List */}
      <div className="bg-gray-50 dark:bg-gray-900/60 rounded-xl p-3.5 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Row Entity Spans ({spans.length})
          </span>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            + Add Entity Type
          </button>
        </div>

        {spans.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">No entities tagged in this row yet. Highlight any text above to tag.</p>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
            {spans.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs shadow-xs"
              >
                <span className="font-semibold text-gray-800 dark:text-gray-200">"{s.text}"</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${s.colour}`}>
                  {s.label}
                </span>
                <span className="text-[10px] font-mono text-gray-400">[{s.start}:{s.end}]</span>
                <button
                  onClick={() => removeSpan(idx)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                  title="Remove"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Entity Type Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Add Custom Entity Type</h3>
            <input
              type="text"
              value={newEntityName}
              onChange={(e) => setNewEntityName(e.target.value.toUpperCase())}
              placeholder="e.g. PROCEDURE, GENE, DRUG"
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white uppercase outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewEntityName('');
                }}
                className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const trimmed = newEntityName.trim();
                  if (!trimmed) return;
                  if (entityTypes.some((e) => e.name === trimmed)) {
                    if (onToast) onToast('Entity type already exists', 'warning');
                    return;
                  }
                  const colourOptions = [
                    'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/60 dark:text-cyan-200',
                    'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/60 dark:text-rose-200',
                    'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-900/60 dark:text-violet-200',
                    'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/60 dark:text-teal-200',
                  ];
                  const newType = {
                    name: trimmed,
                    colour: colourOptions[entityTypes.length % colourOptions.length],
                    key: String(entityTypes.length + 1),
                  };
                  if (onAddEntityType) onAddEntityType(newType);
                  setShowAddModal(false);
                  setNewEntityName('');
                  if (onToast) onToast(`Added entity type ${trimmed}`, 'success');
                }}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
              >
                Add Entity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
