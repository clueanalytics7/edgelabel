import { useState, useMemo, useRef } from 'react';

/**
 * Standardized Preset Taxonomy Codebooks
 */
const PRESET_CODEBOOKS = [
  {
    id: 'sentiment_stance',
    name: 'Sentiment & Stance Analysis',
    taskType: 'text_classification',
    description: 'Fine-grained sentiment classification with stance and escalation markers.',
    guidelines: 'Evaluate customer utterances based on emotional valence, tone, and explicit intent.',
    labels: [
      { name: 'Very Positive', color: '#10b981', shortcut: '1', description: 'Strong enthusiasm, praise, or gratitude' },
      { name: 'Positive', color: '#34d399', shortcut: '2', description: 'General satisfaction or mild approval' },
      { name: 'Neutral', color: '#64748b', shortcut: '3', description: 'Factual statements, inquiries without emotion' },
      { name: 'Negative', color: '#f87171', shortcut: '4', description: 'Dissatisfaction, complaints, or mild frustration' },
      { name: 'Escalated Concern', color: '#ef4444', shortcut: '5', description: 'Urgent churn risk, threats, or severe anger' },
    ],
    qualityRules: { minLength: 2, maxLength: 3000, requireCommentForLabels: ['Escalated Concern'] },
  },
  {
    id: 'customer_support_triage',
    name: 'Customer Support & Helpdesk Triage',
    taskType: 'text_classification',
    description: 'Routing support tickets into actionable operational queues.',
    guidelines: 'Assign the primary departmental responsibility and triage urgency.',
    labels: [
      { name: 'Billing & Payments', color: '#3b82f6', shortcut: '1', description: 'Invoices, refunds, chargebacks, subscriptions' },
      { name: 'Technical Bug', color: '#ef4444', shortcut: '2', description: 'Crashes, error codes, failed UI actions' },
      { name: 'Feature Request', color: '#8b5cf6', shortcut: '3', description: 'Product suggestions and workflow improvements' },
      { name: 'Account & Access', color: '#f59e0b', shortcut: '4', description: 'Password resets, 2FA, permissions, SSO' },
      { name: 'General Inquiry', color: '#10b981', shortcut: '5', description: 'Informational questions and documentation lookup' },
    ],
    qualityRules: { minLength: 5, maxLength: 5000, requireCommentForLabels: ['Technical Bug'] },
  },
  {
    id: 'biomedical_ner',
    name: 'Biomedical & Clinical Entities (NER)',
    taskType: 'ner',
    description: 'High-precision clinical entity extraction for healthcare text mining.',
    guidelines: 'Identify exact character spans for clinical findings, pharmacotherapy, and procedures.',
    labels: [
      { name: 'DIAGNOSIS', color: '#ef4444', shortcut: 'D', description: 'Disease, condition, syndrome, or pathology' },
      { name: 'MEDICATION', color: '#3b82f6', shortcut: 'M', description: 'Brand or generic drug name' },
      { name: 'DOSAGE', color: '#10b981', shortcut: 'S', description: 'Strength, frequency, or administration duration' },
      { name: 'ANATOMY', color: '#8b5cf6', shortcut: 'A', description: 'Body part, organ system, or tissue' },
      { name: 'PROCEDURE', color: '#f59e0b', shortcut: 'P', description: 'Diagnostic test, surgery, or clinical intervention' },
    ],
    qualityRules: { minLength: 5, maxLength: 8000, requireCommentForLabels: [] },
  },
  {
    id: 'content_safety',
    name: 'Content Moderation & Trust & Safety',
    taskType: 'text_classification',
    description: 'Platform safety, toxicity detection, and policy violation enforcement.',
    guidelines: 'Flag harmful content according to community safety guidelines and privacy policies.',
    labels: [
      { name: 'Safe', color: '#10b981', shortcut: '1', description: 'Benign conversation complying with all policies' },
      { name: 'Toxic Language', color: '#f97316', shortcut: '2', description: 'Rude, vulgar, or unconstructive speech' },
      { name: 'Harassment', color: '#ef4444', shortcut: '3', description: 'Targeted attacks, bullying, or intimidation' },
      { name: 'Hate Speech', color: '#dc2626', shortcut: '4', description: 'Attacks based on protected identity attributes' },
      { name: 'PII / Sensitive Data', color: '#7c3aed', shortcut: '5', description: 'Exposed credentials, phone numbers, or health records' },
    ],
    qualityRules: { minLength: 2, maxLength: 4000, requireCommentForLabels: ['Harassment', 'Hate Speech'] },
  },
  {
    id: 'cv_autonomous_mobility',
    name: 'Autonomous Mobility & Vision Detection',
    taskType: 'image_annotation',
    description: 'Computer vision bounding box taxonomy for roadway objects.',
    guidelines: 'Tight bounding boxes around visible vehicle surfaces and pedestrians.',
    labels: [
      { name: 'Vehicle', color: '#3b82f6', shortcut: '1', description: 'Cars, trucks, buses, vans' },
      { name: 'Pedestrian', color: '#10b981', shortcut: '2', description: 'Standing, walking, or running humans' },
      { name: 'Cyclist', color: '#8b5cf6', shortcut: '3', description: 'Bicycles, e-scooters, and riders' },
      { name: 'Traffic Sign', color: '#ef4444', shortcut: '4', description: 'Regulatory, warning, and guide signs' },
      { name: 'Obstacle / Hazard', color: '#f59e0b', shortcut: '5', description: 'Cones, debris, construction barriers' },
    ],
    qualityRules: { minLength: 0, maxLength: 0, requireCommentForLabels: [] },
  },
];

// Helper to extract hex color from class or object
function getHexColor(colorOrClass, fallback = '#3b82f6') {
  if (!colorOrClass) return fallback;
  if (colorOrClass.startsWith('#')) return colorOrClass;
  // If Tailwind color classes are passed
  if (colorOrClass.includes('blue')) return '#3b82f6';
  if (colorOrClass.includes('green') || colorOrClass.includes('emerald')) return '#10b981';
  if (colorOrClass.includes('red') || colorOrClass.includes('rose')) return '#ef4444';
  if (colorOrClass.includes('purple')) return '#8b5cf6';
  if (colorOrClass.includes('orange') || colorOrClass.includes('amber')) return '#f59e0b';
  if (colorOrClass.includes('teal')) return '#14b8a6';
  if (colorOrClass.includes('pink')) return '#ec4899';
  if (colorOrClass.includes('yellow')) return '#eab308';
  return fallback;
}

export function TaxonomyCodebookModal({
  show,
  onClose,
  taskType = 'text_classification',
  currentLabels = [],
  currentGuidelines = '',
  currentQualityRules = {},
  projectName = 'EdgeLabel Project',
  onApplyTaxonomy,
  onToast,
}) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'import' | 'presets'
  const [importedJson, setImportedJson] = useState('');
  const [parsedImport, setParsedImport] = useState(null);
  const [importError, setImportError] = useState('');
  const [editableGuidelines, setEditableGuidelines] = useState(currentGuidelines);
  const fileInputRef = useRef(null);

  // Synchronize when opening
  useMemo(() => {
    if (show) {
      setEditableGuidelines(currentGuidelines);
      setParsedImport(null);
      setImportError('');
      setImportedJson('');
    }
  }, [show, currentGuidelines]);

  // Standardized codebook object for export
  const exportableCodebook = useMemo(() => {
    const formattedLabels = currentLabels.map((l, idx) => ({
      id: l.id || `lbl_${idx + 1}`,
      name: l.name || l.label || 'Unnamed',
      color: getHexColor(l.color || l.colour),
      shortcut: l.shortcut || String(idx + 1),
      description: l.description || `Criteria for ${l.name || l.label}`,
      examples: l.examples || [],
    }));

    return {
      $schema: 'https://edgelabel.cueligence.com/schemas/codebook-v1.json',
      projectName,
      organization: 'Cueligence',
      taskType,
      version: '1.2.0',
      exportedAt: new Date().toISOString(),
      guidelines: editableGuidelines || 'Review each data item and assign the most fitting label according to criteria.',
      taxonomy: formattedLabels,
      qualityRules: {
        minLength: currentQualityRules?.minLength || 1,
        maxLength: currentQualityRules?.maxLength || 5000,
        requireCommentForLabels: currentQualityRules?.requireCommentForLabels || [],
        allowMultipleLabels: !!currentQualityRules?.allowMultipleLabels,
      },
    };
  }, [currentLabels, editableGuidelines, currentQualityRules, projectName, taskType]);

  // Download codebook JSON
  const handleDownloadCodebook = () => {
    const jsonStr = JSON.stringify(exportableCodebook, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taxonomy_codebook_${projectName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (onToast) onToast('Taxonomy Codebook exported (.json)', 'success');
  };

  // Copy codebook JSON
  const handleCopyCodebook = () => {
    const jsonStr = JSON.stringify(exportableCodebook, null, 2);
    navigator.clipboard.writeText(jsonStr);
    if (onToast) onToast('Taxonomy JSON copied to clipboard', 'info');
  };

  // Validate uploaded / pasted JSON
  const handleValidateImport = (rawText) => {
    setImportError('');
    setParsedImport(null);
    if (!rawText.trim()) return;

    try {
      const parsed = JSON.parse(rawText);
      const labels = parsed.taxonomy || parsed.labels || parsed.classes;

      if (!Array.isArray(labels) || labels.length === 0) {
        setImportError("Invalid codebook: missing 'taxonomy', 'labels', or 'classes' array.");
        return;
      }

      // Check each label has a name
      const validLabels = labels.map((l, i) => {
        const name = typeof l === 'string' ? l : l.name || l.label || `Class ${i + 1}`;
        const color = typeof l === 'object' ? getHexColor(l.color || l.colour) : '#3b82f6';
        const shortcut = typeof l === 'object' && l.shortcut ? String(l.shortcut) : String(i + 1);
        const description = typeof l === 'object' ? l.description || '' : '';
        return { id: `lbl_${i + 1}`, name, color, shortcut, description };
      });

      setParsedImport({
        projectName: parsed.projectName || 'Imported Schema',
        taskType: parsed.taskType || taskType,
        guidelines: parsed.guidelines || '',
        taxonomy: validLabels,
        qualityRules: parsed.qualityRules || {},
      });
    } catch (err) {
      setImportError('JSON Syntax Error: ' + err.message);
    }
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      setImportedJson(text);
      handleValidateImport(text);
    };
    reader.readAsText(file);
  };

  // Apply imported schema or preset to workspace
  const handleApplyImported = (schemaToApply) => {
    if (!schemaToApply || !onApplyTaxonomy) return;

    onApplyTaxonomy({
      labels: schemaToApply.taxonomy || schemaToApply.labels,
      guidelines: schemaToApply.guidelines,
      qualityRules: schemaToApply.qualityRules,
      taskType: schemaToApply.taskType,
      projectName: schemaToApply.projectName || schemaToApply.name,
    });

    if (onToast) {
      onToast(`Applied taxonomy: ${schemaToApply.projectName || schemaToApply.name}`, 'success');
    }
    onClose();
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-base">
                Annotation Taxonomy &amp; Codebook Manager
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Export, import, and standardize class palettes, shortcuts, and guidelines across annotators.
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

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 pt-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'active'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <span>Active Taxonomy &amp; Export</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
              {currentLabels.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <span>Import Codebook (.json)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <span>Preset Schemas</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300">
              {PRESET_CODEBOOKS.length}
            </span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5 text-xs text-gray-700 dark:text-gray-300">
          {activeTab === 'active' && (
            <div className="space-y-4">
              {/* Guidelines Editor */}
              <div>
                <label className="block font-semibold mb-1 uppercase tracking-wider text-[11px] text-gray-500">
                  Labeling Instructions &amp; Codebook Guidelines
                </label>
                <textarea
                  rows={3}
                  value={editableGuidelines}
                  onChange={(e) => setEditableGuidelines(e.target.value)}
                  placeholder="Explain class boundary definitions, edge cases, and mandatory notes for annotators..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed text-xs"
                />
              </div>

              {/* Active Labels List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold uppercase tracking-wider text-[11px] text-gray-500">
                    Active Class Taxonomy ({currentLabels.length} classes)
                  </span>
                  <span className="text-[11px] text-gray-400">Standard hex palettes &amp; shortcuts</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentLabels.map((l, i) => {
                    const hex = getHexColor(l.color || l.colour);
                    const name = l.name || l.label || `Class ${i + 1}`;
                    return (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 flex items-center gap-3"
                      >
                        <span
                          className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: hex }}
                          title={hex}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-gray-800 dark:text-gray-100 truncate">{name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 shrink-0">
                              Key: {l.shortcut || i + 1}
                            </span>
                          </div>
                          {l.description ? (
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">{l.description}</p>
                          ) : (
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{hex}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Export actions card */}
              <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-0.5 text-center sm:text-left">
                  <span className="font-bold text-blue-900 dark:text-blue-200">Shareable Codebook Package</span>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400">
                    Distribute <code className="font-mono bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded">taxonomy-codebook.json</code> to your annotators to ensure identical palettes and shortcuts.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyCodebook}
                    className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 hover:bg-gray-50 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 transition"
                  >
                    Copy JSON
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCodebook}
                    className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download .json</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              {/* File input / Drag drop */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer bg-gray-50/50 dark:bg-gray-850/50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
                  Click to select or drop <code className="font-mono text-blue-600 dark:text-blue-400">taxonomy-codebook.json</code>
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Compatible with EdgeLabel, SpaCy, and Roboflow schema JSON</p>
              </div>

              {/* Or paste raw JSON */}
              <div>
                <label className="block font-semibold mb-1 uppercase tracking-wider text-[11px] text-gray-500">
                  Or Paste JSON Schema Directly
                </label>
                <textarea
                  rows={4}
                  value={importedJson}
                  onChange={(e) => {
                    setImportedJson(e.target.value);
                    handleValidateImport(e.target.value);
                  }}
                  placeholder='{"projectName": "Medical NER", "taxonomy": [{"name": "Condition", "color": "#ef4444"}]}'
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 font-mono text-[11px] text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {importError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{importError}</span>
                </div>
              )}

              {parsedImport && (
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-emerald-900 dark:text-emerald-200">
                        Valid Schema Detected: {parsedImport.projectName}
                      </span>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        {parsedImport.taxonomy.length} classes parsed · Target mode: {parsedImport.taskType}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyImported(parsedImport)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition"
                    >
                      Apply to Workspace
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {parsedImport.taxonomy.map((c, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100"
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Choose an industry-standard template to immediately configure class labels, colors, and instructions:
              </p>
              <div className="grid grid-cols-1 gap-3">
                {PRESET_CODEBOOKS.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-850/50 hover:border-blue-400 dark:hover:border-blue-600 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white text-xs">{preset.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                          {preset.taskType}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{preset.description}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {preset.labels.map((l, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-medium"
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                            {l.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyImported(preset)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition shrink-0 text-xs"
                    >
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/60">
          <span className="text-[11px] text-gray-400">
            Cueligence Codebook Standard v1.2 · 100% In-Browser
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors border border-gray-200 dark:border-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
