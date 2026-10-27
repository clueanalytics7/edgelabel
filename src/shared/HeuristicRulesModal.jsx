import React, { useState, useMemo } from 'react';
import { PRESET_RULE_PACKS, runHeuristicDryRun, applyHeuristicRules } from './heuristicEngine.js';

export function HeuristicRulesModal({
  show,
  onClose,
  dataItems = [],
  selectedColumn = 0,
  currentAnnotations = [],
  onApplyRules,
  annotationMode = 'ner', // 'ner' | 'classification'
  onToast,
}) {
  const [activePackId, setActivePackId] = useState(annotationMode === 'ner' ? 'clinical_ner' : 'sentiment_intent');
  const [rules, setRules] = useState(() => {
    const pack = PRESET_RULE_PACKS.find((p) => p.id === (annotationMode === 'ner' ? 'clinical_ner' : 'sentiment_intent')) || PRESET_RULE_PACKS[0];
    return pack.rules;
  });

  const [dryRunResult, setDryRunResult] = useState(null);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRulePattern, setNewRulePattern] = useState('');
  const [newRuleLabel, setNewRuleLabel] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Switch preset pack
  const handleSelectPack = (packId) => {
    setActivePackId(packId);
    const pack = PRESET_RULE_PACKS.find((p) => p.id === packId);
    if (pack) {
      setRules(pack.rules);
      setDryRunResult(null);
    }
  };

  const handleToggleRule = (ruleId) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
    setDryRunResult(null);
  };

  const handleRunDryRun = () => {
    const res = runHeuristicDryRun({
      dataItems,
      selectedColumn,
      rules,
      type: annotationMode,
    });
    setDryRunResult(res);
    if (onToast) {
      onToast(`Dry run: ${res.matchedRowsCount} rows matched (${res.matchPct}%)`, 'info');
    }
  };

  const handleApply = (mode = 'unlabeled_only') => {
    const { updatedAnnotations, appliedCount } = applyHeuristicRules({
      dataItems,
      selectedColumn,
      rules,
      existingAnnotations: currentAnnotations,
      mode,
      type: annotationMode,
    });

    onApplyRules(updatedAnnotations, appliedCount);
    if (onToast) {
      onToast(`Applied heuristic rules to ${appliedCount} rows!`, 'success');
    }
    onClose();
  };

  const handleAddCustomRule = () => {
    if (!newRulePattern.trim() || !newRuleLabel.trim()) {
      if (onToast) onToast('Pattern and target label are required.', 'warning');
      return;
    }

    try {
      new RegExp(newRulePattern.trim());
    } catch {
      if (onToast) onToast('Invalid regular expression pattern.', 'error');
      return;
    }

    const newRule = {
      id: `custom_${Date.now()}`,
      name: newRuleName.trim() || `Rule: ${newRuleLabel}`,
      pattern: newRulePattern.trim(),
      flags: 'gi',
      targetLabel: newRuleLabel.trim().toUpperCase(),
      targetColor: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/50 dark:text-teal-200',
      enabled: true,
    };

    setRules((prev) => [...prev, newRule]);
    setNewRuleName('');
    setNewRulePattern('');
    setNewRuleLabel('');
    setShowAddForm(false);
    setDryRunResult(null);
    if (onToast) onToast(`Added rule "${newRule.name}"`, 'success');
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Heuristic & Regex Pre-Labeling Engine
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Bulk pre-label patterns locally in browser memory — zero server leakage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Preset Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Preset Rule Packs
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PRESET_RULE_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => handleSelectPack(pack.id)}
                  className={`text-left p-3 rounded-xl border transition-all text-xs ${
                    activePackId === pack.id
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 shadow-xs'
                      : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="font-bold mb-1 flex items-center justify-between">
                    <span>{pack.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono">
                      {pack.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-[11px] leading-relaxed line-clamp-2">
                    {pack.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Rules List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Configured Rules ({rules.length})
              </label>
              <button
                onClick={() => setShowAddForm((p) => !p)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                {showAddForm ? '− Cancel Custom Rule' : '+ Add Custom Regex Rule'}
              </button>
            </div>

            {/* Custom Rule Input Form */}
            {showAddForm && (
              <div className="bg-gray-50 dark:bg-gray-800/80 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 mb-3 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                    placeholder="Rule Name (e.g. Lab Tests)"
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none"
                  />
                  <input
                    type="text"
                    value={newRulePattern}
                    onChange={(e) => setNewRulePattern(e.target.value)}
                    placeholder="Regex (e.g. \b(MRI|CT|X-ray)\b)"
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono outline-none"
                  />
                  <input
                    type="text"
                    value={newRuleLabel}
                    onChange={(e) => setNewRuleLabel(e.target.value)}
                    placeholder="Label (e.g. PROCEDURE)"
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white uppercase outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleAddCustomRule}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    Save Rule
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                    rule.enabled
                      ? 'bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700'
                      : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggleRule(rule.id)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <div>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 mr-2">{rule.name}</span>
                      <code className="text-[11px] text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700/60 px-1.5 py-0.5 rounded">
                        /{rule.pattern}/{rule.flags || 'gi'}
                      </code>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase shrink-0 ${rule.targetColor}`}>
                    {rule.targetLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dry Run Preview Box */}
          {dryRunResult && (
            <div className="bg-indigo-50/50 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                  Dry Run Results
                </span>
                <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 px-2.5 py-0.5 rounded-full">
                  {dryRunResult.matchedRowsCount} of {dryRunResult.totalRows} rows matched ({dryRunResult.matchPct}%)
                </span>
              </div>

              {dryRunResult.conflicts.length > 0 && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                  ⚠️ <strong>{dryRunResult.conflicts.length} Overlapping/Conflicting matches</strong> detected. EdgeLabel will prioritize non-overlapping spans.
                </div>
              )}

              {/* Sample Matches list */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Sample Detected Matches:</span>
                {dryRunResult.sampleMatches.map((sample, i) => (
                  <div key={i} className="text-xs bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                    <span className="text-gray-400 font-mono mr-2">#{sample.rowIndex + 1}</span>
                    <span className="text-gray-700 dark:text-gray-300">{sample.text}</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {sample.spans.map((sp, idx) => (
                        <span key={idx} className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${sp.colour}`}>
                          "{sp.text}" → {sp.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-2">
          <button
            onClick={handleRunDryRun}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            🔍 Run Dry-Run Preview
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleApply('unlabeled_only')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              Apply to Unlabeled Rows
            </button>
            <button
              onClick={() => handleApply('overwrite_all')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              Apply to All Matches
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
