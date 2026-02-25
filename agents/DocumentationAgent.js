const { OpenAI } = require('openai');

class DocumentationAgent {
  constructor() {
    this.openai = null;
    this.initialized = false;
  }

  async initializeClients() {
    if (this.initialized) return;

    try {
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const apiKey = process.env.AZURE_OPENAI_KEY;

      if (!endpoint || !apiKey) {
        throw new Error('Missing required environment variables: AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY');
      }

      // Initialize Azure OpenAI client
      this.openai = new OpenAI({
        apiKey: apiKey,
        baseURL: `${endpoint}/openai/deployments/gpt-4o-mini`,
        defaultQuery: { 'api-version': '2023-12-01-preview' },
        defaultHeaders: { 'api-key': apiKey },
      });

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing DocumentationAgent:', error);
      throw new Error('Failed to initialize Azure OpenAI client');
    }
  }

  async processHandoverNote(rawNote) {
    if (!this.initialized) {
      await this.initializeClients();
    }

    if (!rawNote || typeof rawNote !== 'string' || rawNote.trim().length === 0) {
      throw new Error('Invalid handover note: must be a non-empty string');
    }

    const systemPrompt = `You are a clinical documentation specialist for nursing handovers. Your task is to convert raw handover notes into structured SOAP clinical notes.

SOAP format guidelines:
- S (Subjective): Patient's reported symptoms, complaints, history, and subjective experiences
- O (Objective): Observable facts, vital signs, physical exam findings, measurements, and clinical observations
- A (Assessment): Clinical judgment, diagnosis, interpretation of findings, and professional assessment
- P (Plan): Nursing interventions, treatments, medications, follow-up actions, and care planning

From the handover note, extract and structure the information. Also identify:
- patientName: The patient's full name (if not available, use "Unknown Patient")
- ward: The hospital ward or unit (if not specified, use "General Ward")
- timestamp: Current date and time in ISO 8601 format (e.g., "2026-02-22T10:30:00Z")

IMPORTANT: Return ONLY a valid JSON object with these exact fields and no additional text:
{
  "subjective": "string with subjective information",
  "objective": "string with objective findings",
  "assessment": "string with clinical assessment",
  "plan": "string with nursing plan",
  "patientName": "string",
  "ward": "string",
  "timestamp": "ISO 8601 string"
}

Ensure the JSON is properly formatted and parseable. Do not include markdown, code blocks, or explanatory text.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Please convert this handover note to a structured SOAP format:\n\n${rawNote}`
          }
        ],
        max_tokens: 1500,
        temperature: 0.1, // Low temperature for consistent clinical formatting
      });

      const content = completion.choices[0].message.content.trim();

      // Validate that the response is valid JSON
      let parsedResult;
      try {
        parsedResult = JSON.parse(content);
      } catch (parseError) {
        console.error('AI response is not valid JSON:', content);
        throw new Error('AI service returned invalid JSON format');
      }

      // Validate required fields
      const requiredFields = ['subjective', 'objective', 'assessment', 'plan', 'patientName', 'ward', 'timestamp'];
      for (const field of requiredFields) {
        if (!(field in parsedResult)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate timestamp format
      if (!parsedResult.timestamp.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        // If invalid, set current timestamp
        parsedResult.timestamp = new Date().toISOString();
      }

      return parsedResult;

    } catch (error) {
      console.error('Error processing handover note:', error);

      if (error.message.includes('AI service') || error.message.includes('Missing required')) {
        throw error; // Re-throw our custom errors
      }

      // Handle OpenAI API errors
      if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.status === 401) {
        throw new Error('Authentication failed. Check API key configuration.');
      } else if (error.status >= 500) {
        throw new Error('Azure OpenAI service temporarily unavailable. Please try again.');
      } else {
        throw new Error(`Failed to process handover note: ${error.message}`);
      }
    }
  }
}

module.exports = DocumentationAgent;
