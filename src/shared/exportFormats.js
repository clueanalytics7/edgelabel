/**
 * Advanced Export Formats for LLM Fine-Tuning, ML Pipelines, NER, and Data Science
 */

export const EXPORT_FORMATS = [
  // --- LLM & Classification Formats ---
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
    mode: 'classification',
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
    mode: 'classification',
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
    mode: 'classification',
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
    mode: 'classification',
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
    mode: 'classification',
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
    mode: 'classification',
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
    mode: 'classification',
  },

  // --- NER / Entity Spans Formats ---
  {
    id: 'spacy_ner',
    name: 'SpaCy v3 NER (JSONL)',
    ext: 'jsonl',
    mime: 'application/jsonlines',
    badge: 'NER Training',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
    description: 'Standard SpaCy v3 entity training format: {"text": "...", "entities": [[start, end, "LABEL"], ...]}',
    hasInstruction: false,
    mode: 'ner',
  },
  {
    id: 'conll_iob2',
    name: 'CoNLL-2003 IOB2 (.conll)',
    ext: 'conll',
    mime: 'text/plain;charset=utf-8;',
    badge: 'Token Sequence',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    description: 'Token-level IOB2 tagging (Token B-LABEL, I-LABEL, O) for flair, BERT, and CRF models.',
    hasInstruction: false,
    mode: 'ner',
  },
  {
    id: 'huggingface_ner',
    name: 'Hugging Face Token Classification (JSONL)',
    ext: 'jsonl',
    mime: 'application/jsonlines',
    badge: 'HF Transformers',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    description: 'Token classification schema {"id": 1, "tokens": [...], "ner_tags": [...]} for PyTorch/HuggingFace.',
    hasInstruction: false,
    mode: 'ner',
  },
  {
    id: 'spans_json',
    name: 'Entity Spans JSON',
    ext: 'json',
    mime: 'application/json',
    badge: 'Structured Spans',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    description: 'Structured array of documents with character offsets, span texts, and entity categories.',
    hasInstruction: false,
    mode: 'ner',
  },
];

/**
 * Tokenize a text string while preserving character offsets
 */
function tokenizeWithOffsets(text) {
  const regex = /\S+/g;
  const tokens = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    tokens.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return tokens;
}

/**
 * Convert character spans to token-level IOB2 tags
 */
function assignIOB2Tags(tokens, spans = []) {
  const sortedSpans = [...spans].sort((a, b) => a.start - b.start);
  return tokens.map((token) => {
    // Find matching span
    const matched = sortedSpans.find((s) => token.start >= s.start && token.end <= s.end);
    if (!matched) return 'O';

    // If token starts at beginning of span -> B-tag, otherwise I-tag
    if (token.start === matched.start) {
      return `B-${matched.label}`;
    }
    return `I-${matched.label}`;
  });
}

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
  annotationMode = 'classification',
}) {
  const annotatedRows = [];
  dataItems.forEach((row, i) => {
    const ann = annotations[i];
    if (!ann) return;

    // Check if row has classification or spans
    const hasSpans = Array.isArray(ann.spans) && ann.spans.length > 0;
    const hasLabel = !!ann.label;

    if (!hasSpans && !hasLabel) return;

    annotatedRows.push({
      rowIndex: i,
      text: row[selectedColumn] || '',
      label: ann.label,
      spans: ann.spans || [],
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
    // --- NER Formats ---
    case 'spacy_ner': {
      return annotatedRows
        .map((r) => {
          const entities = (r.spans || []).map((s) => [s.start, s.end, s.label]);
          return JSON.stringify({
            text: r.text,
            entities,
          });
        })
        .join('\n');
    }

    case 'conll_iob2': {
      return annotatedRows
        .map((r) => {
          const tokens = tokenizeWithOffsets(r.text);
          const iobTags = assignIOB2Tags(tokens, r.spans || []);
          const lines = tokens.map((t, idx) => `${t.text}\t${iobTags[idx]}`);
          return lines.join('\n');
        })
        .join('\n\n');
    }

    case 'huggingface_ner': {
      return annotatedRows
        .map((r, rowIdx) => {
          const tokens = tokenizeWithOffsets(r.text);
          const iobTags = assignIOB2Tags(tokens, r.spans || []);
          return JSON.stringify({
            id: rowIdx + 1,
            tokens: tokens.map((t) => t.text),
            ner_tags: iobTags,
          });
        })
        .join('\n');
    }

    case 'spans_json': {
      const formatted = annotatedRows.map((r) => ({
        id: r.rowIndex + 1,
        text: r.text,
        spans: r.spans || [],
        comment: r.comment,
      }));
      return JSON.stringify(formatted, null, 2);
    }

    // --- Classification Formats ---
    case 'openai_chat': {
      return annotatedRows
        .map((r) =>
          JSON.stringify({
            messages: [
              ...(instruction ? [{ role: 'system', content: instruction }] : []),
              { role: 'user', content: r.text },
              { role: 'assistant', content: r.label || (r.spans?.[0]?.label ?? '') },
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
                parts: [{ text: r.label || (r.spans?.[0]?.label ?? '') }],
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
            output: r.label || (r.spans?.[0]?.label ?? ''),
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
            label_text: r.label || '',
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
            completion: ` ${r.label || ''}`,
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
            _annotation_spans: r.spans,
            _annotation_comment: r.comment,
          };
        }
        return {
          id: r.rowIndex + 1,
          data: r.text,
          label: r.label,
          spans: r.spans,
          comment: r.comment,
        };
      });
      return JSON.stringify(formatted, null, 2);
    }

    case 'standard_csv':
    default: {
      const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      if (includeAllOriginalColumns && columnHeaders.length) {
        const headers = [...columnHeaders, 'Label', 'Entities_JSON', 'Comment'];
        const rows = [headers.map(escape).join(',')];
        annotatedRows.forEach((r) => {
          const spansJson = r.spans && r.spans.length ? JSON.stringify(r.spans) : '';
          const line = [...r.fullRow, r.label || '', spansJson, r.comment || ''];
          rows.push(line.map(escape).join(','));
        });
        return rows.join('\n');
      } else {
        const rows = ['"Data","Label","Entities_JSON","Comment"'];
        annotatedRows.forEach((r) => {
          const spansJson = r.spans && r.spans.length ? JSON.stringify(r.spans) : '';
          rows.push(`${escape(r.text)},${escape(r.label || '')},${escape(spansJson)},${escape(r.comment || '')}`);
        });
        return rows.join('\n');
      }
    }
  }
}
