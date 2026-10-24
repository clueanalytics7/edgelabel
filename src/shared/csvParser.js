/**
 * Shared CSV parser — RFC-4180 compliant, handles quoted fields.
 * Returns { headers: string[], data: string[][] }
 */
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          // Escaped quote
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        row.push(field.trim());
        field = '';
        i++;
      } else if (ch === '\r' && text[i + 1] === '\n') {
        row.push(field.trim());
        if (row.some(c => c)) rows.push(row);
        row = [];
        field = '';
        i += 2;
      } else if (ch === '\n' || ch === '\r') {
        row.push(field.trim());
        if (row.some(c => c)) rows.push(row);
        row = [];
        field = '';
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }
  // Last field / row
  if (field || row.length) {
    row.push(field.trim());
    if (row.some(c => c)) rows.push(row);
  }

  if (!rows.length) return { headers: [], data: [] };
  return { headers: rows[0], data: rows.slice(1) };
}
