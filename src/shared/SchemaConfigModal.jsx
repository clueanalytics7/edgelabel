import { useState } from 'react';

export function SchemaConfigModal({
  show,
  onClose,
  schemaConfig,
  onSaveSchema,
  labelsList,
  onToast,
}) {
  const [config, setConfig] = useState(
    schemaConfig || {
      guidelines: 'Carefully read the text segment and assign the most appropriate label.',
      minLength: 1,
      maxLength: 2000,
      requireCommentForLabels: [],
      allowMultipleLabels: false,
    }
  );

  if (!show) return null;

  const handleToggleRequireComment = (labelName) => {
    setConfig((prev) => {
      const exists = prev.requireCommentForLabels.includes(labelName);
      return {
        ...prev,
        requireCommentForLabels: exists
          ? prev.requireCommentForLabels.filter((l) => l !== labelName)
          : [...prev.requireCommentForLabels, labelName],
      };
    });
  };

  const handleSave = () => {
    onSaveSchema(config);
    if (onToast) onToast('Annotation Schema & Validation rules saved!', 'success');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-base">
              Annotation Schema &amp; Quality Rules
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Define validation constraints, mandatory reasons, and team labeling guidelines.
            </p>
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

        {/* Form Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5 text-xs text-gray-700 dark:text-gray-300">
          {/* Labeling Guidelines */}
          <div>
            <label className="block font-semibold mb-1 uppercase tracking-wider text-[11px] text-gray-500">
              Task Guidelines &amp; Annotation Codebook
            </label>
            <textarea
              rows={3}
              value={config.guidelines}
              onChange={(e) => setConfig({ ...config, guidelines: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              placeholder="Describe label criteria for annotators..."
            />
          </div>

          {/* Text Length Constraints */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-[11px] text-gray-500 uppercase">
                Min Text Length (Chars)
              </label>
              <input
                type="number"
                min="0"
                value={config.minLength}
                onChange={(e) => setConfig({ ...config, minLength: parseInt(e.target.value) || 0 })}
                className="w-full p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-800 dark:text-gray-200 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[11px] text-gray-500 uppercase">
                Max Text Length (Chars)
              </label>
              <input
                type="number"
                min="10"
                value={config.maxLength}
                onChange={(e) => setConfig({ ...config, maxLength: parseInt(e.target.value) || 2000 })}
                className="w-full p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-800 dark:text-gray-200 outline-none"
              />
            </div>
          </div>

          {/* Required Comment Condition */}
          <div>
            <label className="block font-semibold mb-1 text-[11px] text-gray-500 uppercase">
              Mandatory Comment for Specific Labels
            </label>
            <p className="text-[11px] text-gray-400 mb-2">
              Annotators must enter an explanatory note before applying any selected label:
            </p>
            <div className="flex flex-wrap gap-2">
              {labelsList.map((l) => {
                const isRequired = config.requireCommentForLabels.includes(l.name);
                return (
                  <button
                    key={l.name}
                    type="button"
                    onClick={() => handleToggleRequireComment(l.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isRequired
                        ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950/40 dark:border-rose-700 dark:text-rose-300 ring-1 ring-rose-500'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {isRequired ? '✓ ' : '+ '} {l.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors border border-gray-200 dark:border-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors"
          >
            Save Schema Rules
          </button>
        </div>
      </div>
    </div>
  );
}
