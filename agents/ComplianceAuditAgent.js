class ComplianceAuditAgent {
    constructor() {
        this.auditLog = [];
    }

    logAction(action, details, userId = 'nurse-user') {
        const entry = {
            timestamp: new Date().toISOString(),
            action,
            details,
            userId,
            sessionId: this.getSessionId(),
            status: 'LOGGED'
        };
        this.auditLog.push(entry);
        console.log(`[AUDIT] ${entry.timestamp}: ${action} — ${details}`);
        return entry;
    }

    auditNoteProcessing(handoverNote, activatedAgents) {
        const wordCount = handoverNote.split(' ').length;
        const containsPHI = this.checkForPHI(handoverNote);

        this.logAction('NOTE_PROCESSED', `Handover note received (${wordCount} words)`);
        this.logAction('AGENTS_ACTIVATED', `Agents used: ${activatedAgents.join(', ')}`);

        if (containsPHI) {
            this.logAction('PHI_DETECTED', 'Note contains patient identifiers — handle per data protection policy');
        }

        return {
            auditEntries: this.auditLog,
            wordCount,
            containsPHI,
            agentsUsed: activatedAgents,
            complianceStatus: 'COMPLIANT',
            timestamp: new Date().toISOString(),
            warnings: containsPHI ? ['Note contains patient identifiable information — ensure secure handling'] : []
        };
    }

    checkForPHI(text) {
        // Check for common PHI indicators
        const phiPatterns = [
            /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/, // dates
            /bed\s+\w+\d+/i,                            // bed numbers
            /\b(mr|mrs|ms|dr)\.?\s+\w+/i,              // names with titles
            /\b\d{2,3}\/\d{2,3}\b/,                    // BP readings
            /\byears?\s+old\b/i                         // age mentions
        ];
        return phiPatterns.some(pattern => pattern.test(text));
    }

    getSessionId() {
        if (!this._sessionId) {
            this._sessionId = 'session-' + Date.now();
        }
        return this._sessionId;
    }

    getAuditSummary() {
        return {
            totalActions: this.auditLog.length,
            sessionId: this.getSessionId(),
            auditLog: this.auditLog
        };
    }
}

module.exports = ComplianceAuditAgent;