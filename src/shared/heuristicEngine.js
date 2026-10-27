/**
 * Client-Side Heuristic & Regex Pre-Labeling Rules Engine
 * 100% In-Browser Memory — Zero External Server Leakage
 */

export const PRESET_RULE_PACKS = [
  {
    id: 'clinical_ner',
    name: 'Clinical & Medical Spans',
    description: 'Auto-detect dosages, durations, frequencies, and vitals from clinical text.',
    type: 'ner',
    rules: [
      {
        id: 'rule_dosage',
        name: 'Dosage / Quantities',
        pattern: '\\b\\d+(?:\\.\\d+)?\\s*(?:mg|ml|mcg|g|tablets?|capsules?|units?|drops?)\\b',
        flags: 'gi',
        targetLabel: 'DOSAGE',
        targetColor: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-200',
        enabled: true,
      },
      {
        id: 'rule_duration',
        name: 'Treatment Durations',
        pattern: '\\b(?:for\\s+)?\\d+\\s*(?:days?|weeks?|months?|hours?)\\b',
        flags: 'gi',
        targetLabel: 'DURATION',
        targetColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200',
        enabled: true,
      },
      {
        id: 'rule_bp',
        name: 'Blood Pressure Readings',
        pattern: '\\b\\d{2,3}\\/\\d{2,3}\\s*(?:mmHg)?\\b',
        flags: 'gi',
        targetLabel: 'VITAL_SIGN',
        targetColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200',
        enabled: true,
      },
      {
        id: 'rule_meds',
        name: 'Common Medications',
        pattern: '\\b(?:amoxicillin|ibuprofen|paracetamol|aspirin|metformin|lisinopril|atorvastatin|omeprazole|azithromycin)\\b',
        flags: 'gi',
        targetLabel: 'MEDICATION',
        targetColor: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/50 dark:text-indigo-200',
        enabled: true,
      },
      {
        id: 'rule_symptoms',
        name: 'Common Symptoms & Pain',
        pattern: '\\b(?:chest pain|headache|fever|cough|fatigue|nausea|shortness of breath|dizziness|rash|infection|tumour)\\b',
        flags: 'gi',
        targetLabel: 'SYMPTOM',
        targetColor: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-200',
        enabled: true,
      },
    ],
  },
  {
    id: 'pii_detection',
    name: 'PII & Sensitive Entities',
    description: 'Detect emails, phone numbers, and IPv4 addresses for redaction or anonymization.',
    type: 'ner',
    rules: [
      {
        id: 'rule_email',
        name: 'Email Addresses',
        pattern: '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}',
        flags: 'gi',
        targetLabel: 'PII_EMAIL',
        targetColor: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/50 dark:text-purple-200',
        enabled: true,
      },
      {
        id: 'rule_phone',
        name: 'Phone Numbers',
        pattern: '\\b(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}\\b',
        flags: 'gi',
        targetLabel: 'PII_PHONE',
        targetColor: 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/50 dark:text-pink-200',
        enabled: true,
      },
      {
        id: 'rule_ip',
        name: 'IP Addresses',
        pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
        flags: 'gi',
        targetLabel: 'PII_IP',
        targetColor: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200',
        enabled: true,
      },
    ],
  },
  {
    id: 'sentiment_intent',
    name: 'Support & Sentiment Classification',
    description: 'Categorize sentiment and ticket urgency based on high-impact keywords.',
    type: 'classification',
    rules: [
      {
        id: 'rule_urgent',
        name: 'Urgent / Escalation',
        pattern: '\\b(?:urgent|asap|emergency|immediately|critical|escalate|lawsuit|broken)\\b',
        flags: 'i',
        targetLabel: 'Negative',
        targetColor: 'bg-red-100 text-red-800 border-red-300',
        enabled: true,
      },
      {
        id: 'rule_positive',
        name: 'Positive Sentiment / Praise',
        pattern: '\\b(?:great|excellent|love|perfect|amazing|fast|helpful|recommend|wonderful)\\b',
        flags: 'i',
        targetLabel: 'Positive',
        targetColor: 'bg-green-100 text-green-800 border-green-300',
        enabled: true,
      },
      {
        id: 'rule_negative',
        name: 'Negative Sentiment / Complaints',
        pattern: '\\b(?:terrible|worst|horrible|waste|scam|disappointed|awful|slow|failed|useless)\\b',
        flags: 'i',
        targetLabel: 'Negative',
        targetColor: 'bg-red-100 text-red-800 border-red-300',
        enabled: true,
      },
    ],
  },
];

/**
 * Execute dry-run preview across dataset rows without modifying state
 */
export function runHeuristicDryRun({
  dataItems,
  selectedColumn,
  rules,
  type = 'ner',
}) {
  const activeRules = rules.filter((r) => r.enabled && r.pattern.trim());
  const compiled = activeRules.map((r) => {
    try {
      return { ...r, regex: new RegExp(r.pattern, r.flags || 'gi'), valid: true };
    } catch {
      return { ...r, valid: false };
    }
  });

  const validRules = compiled.filter((r) => r.valid);
  if (!validRules.length || !dataItems.length) {
    return {
      totalRows: dataItems.length,
      matchedRowsCount: 0,
      matchPct: 0,
      matchesByRule: {},
      conflicts: [],
      sampleMatches: [],
    };
  }

  const matchesByRule = {};
  validRules.forEach((r) => {
    matchesByRule[r.id] = { name: r.name, label: r.targetLabel, count: 0 };
  });

  const matchedRowIndices = new Set();
  const sampleMatches = [];
  const conflicts = [];

  dataItems.forEach((row, rowIndex) => {
    const text = String(row[selectedColumn] || '');
    if (!text.trim()) return;

    const rowSpans = [];
    const triggeredRules = [];

    validRules.forEach((rule) => {
      rule.regex.lastIndex = 0;
      let match;
      while ((match = rule.regex.exec(text)) !== null) {
        const spanText = match[0];
        const start = match.index;
        const end = start + spanText.length;

        rowSpans.push({
          ruleId: rule.id,
          ruleName: rule.name,
          start,
          end,
          text: spanText,
          label: rule.targetLabel,
          colour: rule.targetColor,
        });

        if (!triggeredRules.some((t) => t.id === rule.id)) {
          triggeredRules.push(rule);
          matchesByRule[rule.id].count++;
        }

        // prevent zero-length infinite loops
        if (rule.regex.lastIndex === start) rule.regex.lastIndex++;
      }
    });

    if (rowSpans.length > 0) {
      matchedRowIndices.add(rowIndex);

      // Check classification conflicts (multiple rules assign different labels)
      if (type === 'classification') {
        const uniqueLabels = [...new Set(rowSpans.map((s) => s.label))];
        if (uniqueLabels.length > 1) {
          conflicts.push({
            rowIndex,
            text,
            labels: uniqueLabels,
            rules: triggeredRules.map((r) => r.name),
          });
        }
      }

      // Check span overlaps for NER
      if (type === 'ner' && rowSpans.length > 1) {
        for (let i = 0; i < rowSpans.length; i++) {
          for (let j = i + 1; j < rowSpans.length; j++) {
            const a = rowSpans[i];
            const b = rowSpans[j];
            if (Math.max(a.start, b.start) < Math.min(a.end, b.end)) {
              conflicts.push({
                rowIndex,
                text,
                overlapSpanA: a,
                overlapSpanB: b,
              });
            }
          }
        }
      }

      if (sampleMatches.length < 8) {
        sampleMatches.push({
          rowIndex,
          text,
          spans: rowSpans,
          primaryLabel: rowSpans[0]?.label,
        });
      }
    }
  });

  const matchedRowsCount = matchedRowIndices.size;
  const matchPct = dataItems.length ? Math.round((matchedRowsCount / dataItems.length) * 100) : 0;

  return {
    totalRows: dataItems.length,
    matchedRowsCount,
    matchPct,
    matchesByRule,
    conflicts,
    sampleMatches,
  };
}

/**
 * Apply heuristic rules to dataset annotations
 */
export function applyHeuristicRules({
  dataItems,
  selectedColumn,
  rules,
  existingAnnotations = [],
  mode = 'unlabeled_only', // 'unlabeled_only' | 'overwrite_all'
  type = 'ner', // 'ner' | 'classification'
}) {
  const activeRules = rules.filter((r) => r.enabled && r.pattern.trim());
  const compiled = activeRules.map((r) => {
    try {
      return { ...r, regex: new RegExp(r.pattern, r.flags || 'gi') };
    } catch {
      return null;
    }
  }).filter(Boolean);

  let appliedCount = 0;
  const newAnnotations = [...existingAnnotations];

  dataItems.forEach((row, rowIndex) => {
    const text = String(row[selectedColumn] || '');
    if (!text.trim()) return;

    const existing = newAnnotations[rowIndex];

    if (type === 'classification') {
      if (mode === 'unlabeled_only' && existing?.label) return;

      for (const rule of compiled) {
        rule.regex.lastIndex = 0;
        if (rule.regex.test(text)) {
          newAnnotations[rowIndex] = {
            label: rule.targetLabel,
            colour: rule.targetColor,
            comment: `Auto-labeled via heuristic: ${rule.name}`,
            isHeuristic: true,
          };
          appliedCount++;
          break; // First matching rule wins
        }
      }
    } else {
      // NER Spans
      const spans = (existing?.spans && mode === 'unlabeled_only') ? [...existing.spans] : [];
      let rowAdded = 0;

      for (const rule of compiled) {
        rule.regex.lastIndex = 0;
        let match;
        while ((match = rule.regex.exec(text)) !== null) {
          const spanText = match[0];
          const start = match.index;
          const end = start + spanText.length;

          // Check if already covered by an existing span
          const overlaps = spans.some((s) => Math.max(s.start, start) < Math.min(s.end, end));
          if (!overlaps) {
            spans.push({
              start,
              end,
              text: spanText,
              label: rule.targetLabel,
              colour: rule.targetColor,
              source: 'heuristic',
            });
            rowAdded++;
          }

          if (rule.regex.lastIndex === start) rule.regex.lastIndex++;
        }
      }

      if (rowAdded > 0 || (mode === 'overwrite_all' && spans.length > 0)) {
        // Sort spans by start offset
        spans.sort((a, b) => a.start - b.start);
        newAnnotations[rowIndex] = {
          ...(existing || {}),
          spans,
          hasSpans: spans.length > 0,
        };
        appliedCount++;
      }
    }
  });

  return { updatedAnnotations: newAnnotations, appliedCount };
}
