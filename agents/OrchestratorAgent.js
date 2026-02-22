require('dotenv').config();
const MedicationSafetyAgent = require('./MedicationSafetyAgent');

class OrchestratorAgent {
    constructor(onThinkingUpdate = () => {}) {
        this.onThinkingUpdate = onThinkingUpdate;
        this.logs = [];
        this.medicationAgent = new MedicationSafetyAgent();
    }

    async processInput(handoverNote) {
        this.log('Received handover note input');
        this.onThinkingUpdate('Analyzing input...');

        const activatedAgents = [];
        const outputs = {};

        const lowerNote = handoverNote.toLowerCase();
        const medicationFlagged = lowerNote.includes('medication') || lowerNote.includes('drug') ||
            lowerNote.includes('prescribe') || lowerNote.includes('aspirin') ||
            lowerNote.includes('gtn') || lowerNote.includes('mg') || lowerNote.includes('tablet');

        // Step 1: Always call DocumentationAgent (real AI)
        this.onThinkingUpdate('Activating DocumentationAgent...');
        activatedAgents.push('DocumentationAgent');
        const soapNote = await this.callDocumentationAgent(handoverNote);
        outputs.DocumentationAgent = soapNote;
        this.log('DocumentationAgent completed');

        // Step 2: Call MedicationSafetyAgent if medications detected
        let medicationSafety = null;
        if (medicationFlagged) {
            this.log('Medications mentioned - activating MedicationSafetyAgent');
            this.onThinkingUpdate('Activating MedicationSafetyAgent...');
            activatedAgents.push('MedicationSafetyAgent');
            try {
                medicationSafety = await this.medicationAgent.checkSafety(handoverNote);
                outputs.MedicationSafetyAgent = medicationSafety;
                this.log('MedicationSafetyAgent completed');
            } catch (err) {
                this.log('MedicationSafetyAgent error: ' + err.message);
                medicationSafety = { medications_detected: [], alerts: [], severity_level: 'Unknown' };
            }
        }

        this.onThinkingUpdate('Processing complete');

        return {
            activatedAgents,
            logs: this.logs,
            ...soapNote,
            medicationSafety: medicationSafety
        };
    }

    async callDocumentationAgent(handoverNote) {
        const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
        const apiKey   = process.env.AZURE_OPENAI_KEY;

        if (!endpoint || !apiKey) {
            this.log('WARNING: Azure OpenAI not configured - using fallback');
            return this.fallbackSoapNote();
        }

        try {
           const url = `${endpoint}/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-05-01-preview`;
            this.log('Calling Azure OpenAI: ' + url);

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
                            content: `You are a clinical documentation specialist. Convert nurse handover notes into structured SOAP notes.

Always respond with ONLY a valid JSON object in this exact format, no other text:
{
  "patientName": "extract name and bed from note, or Unknown Patient",
  "subjective": "patient own words, complaints, symptoms",
  "objective": "vital signs, observations, measurements, medications given",
  "assessment": "clinical judgment, diagnosis impression",
  "plan": "nursing interventions, medications, monitoring, referrals"
}`
                        },
                        {
                            role: 'user',
                            content: `Convert this handover note to a SOAP note:\n\n${handoverNote}`
                        }
                    ],
                    max_tokens: 800,
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Azure OpenAI ${response.status}: ${errText}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content.trim();
            const cleaned = content.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            this.log('DocumentationAgent - AI response parsed successfully');
            return parsed;

        } catch (err) {
            this.log('DocumentationAgent AI error: ' + err.message);
            console.error('Azure OpenAI call failed:', err.message);
            return this.fallbackSoapNote();
        }
    }

    fallbackSoapNote() {
        return {
            patientName: "Patient (AI Unavailable)",
            subjective: "Azure OpenAI not reachable. Check AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY in .env",
            objective: "N/A",
            assessment: "N/A",
            plan: "Fix Azure OpenAI configuration to enable real AI processing."
        };
    }

    log(message) {
        const timestamp = new Date().toISOString();
        this.logs.push(`${timestamp}: ${message}`);
        console.log(`${timestamp}: ${message}`);
    }
}

module.exports = OrchestratorAgent;