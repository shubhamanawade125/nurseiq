require('dotenv').config();
const MedicationSafetyAgent = require('./MedicationSafetyAgent');
const PatientCommunicationAgent = require('./PatientCommunicationAgent');
const ComplianceAuditAgent = require('./ComplianceAuditAgent');

class OrchestratorAgent {
    constructor(onThinkingUpdate = () => {}) {
        this.onThinkingUpdate = onThinkingUpdate;
        this.logs = [];
        this.medicationAgent = new MedicationSafetyAgent();
        this.communicationAgent = new PatientCommunicationAgent();
        this.complianceAgent = new ComplianceAuditAgent();
    }

    async processInput(handoverNote) {
        this.log('Received handover note input');
        this.onThinkingUpdate('Analyzing input...');

        const activatedAgents = [];
        const outputs = {};

        const lowerNote = handoverNote.toLowerCase();

        const medicationFlagged = lowerNote.includes('medication') ||
            lowerNote.includes('drug') ||
            lowerNote.includes('prescribe') ||
            lowerNote.includes('aspirin') ||
            lowerNote.includes('tablet') ||
            lowerNote.includes('mg') ||
            lowerNote.includes('spray') ||
            lowerNote.includes('insulin') ||
            lowerNote.includes('warfarin');

        const dischargeFlagged = lowerNote.includes('discharge') ||
            lowerNote.includes('going home') ||
            lowerNote.includes('released') ||
            lowerNote.includes('send home') ||
            lowerNote.includes('ready for discharge');

        // Always call DocumentationAgent
        this.onThinkingUpdate('Activating DocumentationAgent...');
        activatedAgents.push('DocumentationAgent');
        const soapNote = await this.callDocumentationAgent(handoverNote);
        outputs.DocumentationAgent = soapNote;
        this.log('DocumentationAgent completed');

        // Call MedicationSafetyAgent if medications mentioned
        if (medicationFlagged) {
            this.log('Medications mentioned - activating MedicationSafetyAgent');
            this.onThinkingUpdate('Checking medication safety...');
            activatedAgents.push('MedicationSafetyAgent');
            const medSafety = await this.medicationAgent.checkSafety(handoverNote);
            outputs.MedicationSafetyAgent = medSafety;
            this.log('MedicationSafetyAgent completed');
        }

        // Call PatientCommunicationAgent if discharge mentioned
        if (dischargeFlagged) {
            this.log('Discharge mentioned - activating PatientCommunicationAgent');
            this.onThinkingUpdate('Generating patient discharge summary...');
            activatedAgents.push('PatientCommunicationAgent');
            const patientComms = await this.communicationAgent.generateDischargeSummary(handoverNote, soapNote);
            outputs.PatientCommunicationAgent = patientComms;
            this.log('PatientCommunicationAgent completed');
        }

        // Always run ComplianceAuditAgent
        this.log('Running ComplianceAuditAgent');
        this.onThinkingUpdate('Running compliance audit...');
        activatedAgents.push('ComplianceAuditAgent');
        const auditResult = this.complianceAgent.auditNoteProcessing(handoverNote, activatedAgents);
        outputs.ComplianceAuditAgent = auditResult;
        this.log('ComplianceAuditAgent completed');

        this.onThinkingUpdate('Processing complete');

        return {
            activatedAgents,
            logs: this.logs,
            ...soapNote,
            medicationSafety: outputs.MedicationSafetyAgent || null,
            patientCommunication: outputs.PatientCommunicationAgent || null,
            auditResult: auditResult
        };
    }

    async callDocumentationAgent(handoverNote) {
        try {
            const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
            const apiKey = process.env.AZURE_OPENAI_KEY;

            if (!endpoint || !apiKey) {
                throw new Error('Azure OpenAI not configured');
            }

            const url = `${endpoint}/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-05-01-preview`;
            this.log(`Calling Azure OpenAI: ${url}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': apiKey
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'system',
                            content: `You are a clinical documentation specialist. Convert nursing handover notes into structured SOAP format.
Always respond with valid JSON only, no markdown, no explanation.
JSON format:
{
  "patientName": "extracted patient name and bed",
  "subjective": "patient complaints and symptoms in their own words",
  "objective": "vital signs, observations, medications given, test results",
  "assessment": "clinical assessment and likely diagnosis",
  "plan": "care plan and next steps"
}`
                        },
                        {
                            role: 'user',
                            content: `Convert this handover note to a SOAP note: ${handoverNote}`
                        }
                    ],
                    max_tokens: 600,
                    temperature: 0.2
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Azure OpenAI ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content.trim();
            const cleanContent = content.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanContent);

            this.log('DocumentationAgent - AI response parsed successfully');
            return parsed;

        } catch (error) {
            this.log(`DocumentationAgent AI error: ${error.message}`);
            console.error('Azure OpenAI call failed:', error.message);
            return {
                patientName: 'Patient (AI Unavailable)',
                subjective: 'Azure OpenAI not reachable. Check AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY in .env',
                objective: 'N/A',
                assessment: 'N/A',
                plan: 'Fix Azure OpenAI configuration to enable real AI processing.'
            };
        }
    }

    log(message) {
        const timestamp = new Date().toISOString();
        this.logs.push(`${timestamp}: ${message}`);
        console.log(`${timestamp}: ${message}`);
    }
}

module.exports = OrchestratorAgent;