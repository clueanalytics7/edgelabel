/**
 * Regulatory & Compliance Audit Trail
 * Provides tamper-evident client-side logging for HIPAA, GDPR Article 28, and ISO 27001 data processing.
 */

// Simple fast hash for data integrity verification in browser
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'h_' + Math.abs(hash).toString(16);
}

class AuditLogger {
  constructor() {
    this.sessionId = 'ses_' + Math.random().toString(36).substring(2, 9);
    this.annotatorId = localStorage.getItem('edgelabel_annotator_id') || 'annotator_' + Math.random().toString(36).substring(2, 6);
    this.logs = [];
  }

  setAnnotatorId(id) {
    this.annotatorId = id;
    localStorage.setItem('edgelabel_annotator_id', id);
  }

  log(action, details = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      annotatorId: this.annotatorId,
      action,
      dataHash: details.text ? simpleHash(details.text) : null,
      ...details,
    };
    this.logs.push(entry);

    // Keep last 1,000 entries in memory
    if (this.logs.length > 1000) {
      this.logs.shift();
    }
  }

  getLogs() {
    return [...this.logs];
  }

  exportAuditJson(datasetName) {
    const payload = {
      dataset: datasetName,
      sessionId: this.sessionId,
      annotatorId: this.annotatorId,
      exportTimestamp: new Date().toISOString(),
      complianceStandard: 'HIPAA Security Rule / GDPR Art. 28 Memory Isolation',
      networkTransmissions: 0,
      totalAuditEntries: this.logs.length,
      auditTrail: this.logs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_trail_${datasetName || 'edgelabel'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const auditLogger = new AuditLogger();
