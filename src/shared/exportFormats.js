/**
 * Advanced Export Formats for LLM Fine-Tuning, ML Pipelines, and Data Science
 */

export const EXPORT_FORMATS = [
  {
    id: 'openai_chat',
    name: 'OpenAI Chat (ChatML)',
    ext: 'jsonl',
    mime: 'application/jsonlines',
    badge: 'LLM Fine-Tuning',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    description: 'Standard format for GPT-4o / GPT-3.5 fine-tuning using system, user, and assistant messages.',
    hasInstruction: true,
    defaultInstruction: 'You are an accurate text classification assistant. Classify the user input according to the provided labels.',
  },
  {
    id: 'gemini_tune',
    name: 'Google Gemini Tuning',
    ext: 'jsonl',
    mime: 'application/jsonlines',
    badge: 'Gemini SDK',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    description: 'Vertex AI / Google AI Studio Gemini Supervised Tuning format (contents.parts schema).',
    hasInstruction: true,
    defaultInstruction: 'Classify the sentiment or category of the following message.',
  },
  {
    id: 'alpaca_instruct',
    name: 'Alpaca / Instruction',
    ext: 'jsonl',
    mime: 'application/jsonlines',
    badge: 'Open Weights (Llama/Mistral)',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    description: 'Instruction tuning standard (instruction, input, output schema) popular for Llama 3, Mistral, and Qwen.',
    hasInstruction: true,
    defaultInstruction: 'Analyze the text and return the correct classification category.',
  },
  {
    id: 'huggingface_jsonl',
    name: 'Hugging Face Datasets',
    ext: 'jsonl',
    mime: 'application/jsonlines',
    badge: 'HF Hub Ready',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    description: 'Compatible with `datasets.load_dataset("json")` including both integer label index and string label names.',
    hasInstruction: false,
  },
  {
    id: 'openai_completion',
    name: 'Prompt / Completion',
    ext: 'jsonl',
    mime: 'application/jsonlines',
    badge: 'Legacy Completion',
    badgeColor: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    description: 'Classic {"prompt": "...", "completion": "..."} format with standard prompt delimiters.',
    hasInstruction: false,
  },
  {
    id: 'standard_csv',
    name: 'Annotated CSV',
    ext: 'csv',
    mime: 'text/csv;charset=utf-8;',
    badge: 'Tabular',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    description: 'Preserves your original columns with added Label and Comment columns.',
    hasInstruction: false,
  },
  {
    id: 'standard_json',
    name: 'Standard JSON',
    ext: 'json',
    mime: 'application/json',
    badge: 'Web / REST',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
    description: 'Clean array of JSON objects containing input text, label, and metadata.',
    hasInstruction: false,
  },
  {
    id: 'standard_jsonl',
    name: 'Raw JSON Lines',
    ext: 'jsonl',
    mime: 'application/jsonlines',
    badge: 'Lightweight',
    badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
    description: 'One JSON object per row with text, label, and optional comments.',
    hasInstruction: false,
  },
];

/**
 * Builds the string payload according to the chosen format
 */
export function formatDataset({
  formatId,
  dataItems,
  annotations,
  selectedColumn,
  columnHeaders = [],
  instruction = '',
  includeAllOriginalColumns = false,
  labelsList = [],
}) {
  const annotatedRows = [];
  dataItems.forEach((row, i) => {
    const ann = annotations[i];
    if (!ann) return;
    annotatedRows.push({
      rowIndex: i,
      text: row[selectedColumn] || '',
      label: ann.label,
      comment: ann.comment || null,
      fullRow: row,
    });
  });

  if (!annotatedRows.length) return '';

  const labelToId = {};
  labelsList.forEach((lbl, idx) => {
    labelToId[lbl.name] = idx;
  });

  switch (formatId) {
    case 'openai_chat': {
      return annotatedRows
        .map((r) =>
          JSON.stringify({
            messages: [
              ...(instruction ? [{ role: 'system', content: instruction }] : []),
              { role: 'user', content: r.text },
              { role: 'assistant', content: r.label },
            ],
          })
        )
        .join('\n');
    }

    case 'gemini_tune': {
      return annotatedRows
        .map((r) => {
          const userText = instruction ? `${instruction}\n\nInput: ${r.text}` : r.text;
          return JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: userText }],
              },
              {
                role: 'model',
                parts: [{ text: r.label }],
              },
            ],
          });
        })
        .join('\n');
    }

    case 'alpaca_instruct': {
      return annotatedRows
        .map((r) =>
          JSON.stringify({
            instruction: instruction || 'Classify the following text into the designated label.',
            input: r.text,
            output: r.label,
          })
        )
        .join('\n');
    }

    case 'huggingface_jsonl': {
      return annotatedRows
        .map((r) =>
          JSON.stringify({
            id: r.rowIndex + 1,
            text: r.text,
            label: labelToId[r.label] ?? 0,
            label_text: r.label,
            comment: r.comment,
          })
        )
        .join('\n');
    }

    case 'openai_completion': {
      return annotatedRows
        .map((r) =>
          JSON.stringify({
            prompt: `${r.text}\n\n###\n\n`,
            completion: ` ${r.label}`,
          })
        )
        .join('\n');
    }

    case 'standard_json': {
      const formatted = annotatedRows.map((r) => {
        if (includeAllOriginalColumns && columnHeaders.length) {
          const originalObj = {};
          columnHeaders.forEach((h, idx) => {
            originalObj[h || `column_${idx + 1}`] = r.fullRow[idx];
          });
          return {
            ...originalObj,
            _annotation_label: r.label,
            _annotation_comment: r.comment,
          };
        }
        return {
          id: r.rowIndex + 1,
          data: r.text,
          label: r.label,
          comment: r.comment,
        };
      });
      return JSON.stringify(formatted, null, 2);
    }

    case 'standard_jsonl': {
      return annotatedRows
        .map((r) =>
          JSON.stringify({
            id: r.rowIndex + 1,
            data: r.text,
            label: r.label,
            comment: r.comment,
          })
        )
        .join('\n');
    }

    case 'standard_csv':
    default: {
      const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      if (includeAllOriginalColumns && columnHeaders.length) {
        const headers = [...columnHeaders, 'Label', 'Comment'];
        const rows = [headers.map(escape).join(',')];
        annotatedRows.forEach((r) => {
          const line = [...r.fullRow, r.label, r.comment || ''];
          rows.push(line.map(escape).join(','));
        });
        return rows.join('\n');
      } else {
        const rows = ['"Data","Label","Comment"'];
        annotatedRows.forEach((r) => {
          rows.push(`${escape(r.text)},${escape(r.label)},${escape(r.comment || '')}`);
        });
        return rows.join('\n');
      }
    }
  }
}
