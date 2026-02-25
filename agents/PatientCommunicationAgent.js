require('dotenv').config();

class PatientCommunicationAgent {
    constructor() {
        this.endpoint = process.env.AZURE_OPENAI_ENDPOINT;
        this.apiKey = process.env.AZURE_OPENAI_KEY;
    }

    async generateDischargeSummary(handoverNote, soapNote) {
        try {
            const url = `${this.endpoint}/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-05-01-preview`;

            const prompt = `You are a healthcare communication specialist. Based on the clinical information below, generate a patient-friendly discharge summary.

CLINICAL SOAP NOTE:
Subjective: ${soapNote.subjective || ''}
Objective: ${soapNote.objective || ''}
Assessment: ${soapNote.assessment || ''}
Plan: ${soapNote.plan || ''}

Generate a JSON response with these exact fields:
{
  "patientInstructions": "Simple, clear instructions for the patient in plain English (no medical jargon)",
  "medications": "List of medications the patient needs to take, with simple instructions",
  "warningSigns": "Warning signs that should prompt the patient to return to hospital",
  "followUp": "Follow-up appointment and next steps",
  "dietActivity": "Any diet or activity restrictions"
}

Use simple language a patient with no medical background can understand.`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.apiKey
                },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: 'You are a patient communication specialist in healthcare. Always respond with valid JSON only.' },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 800,
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                throw new Error(`Azure OpenAI ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content.trim();

            // Parse JSON response
            const cleanContent = content.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanContent);

            return {
                success: true,
                patientInstructions: parsed.patientInstructions || '',
                medications: parsed.medications || '',
                warningSigns: parsed.warningSign || parsed.warningSigns || '',
                followUp: parsed.followUp || '',
                dietActivity: parsed.dietActivity || ''
            };

        } catch (error) {
            console.warn('PatientCommunicationAgent error:', error.message);
            return {
                success: false,
                patientInstructions: 'Please follow your doctor\'s instructions carefully.',
                medications: 'Take all prescribed medications as directed.',
                warningSign: 'Return to hospital if symptoms worsen.',
                followUp: 'Attend all scheduled follow-up appointments.',
                dietActivity: 'Follow any dietary advice given by your care team.'
            };
        }
    }
}

module.exports = PatientCommunicationAgent;