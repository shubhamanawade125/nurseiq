// AI Agent Logic for NurseIQ
// This file will contain the integration with OpenAI API and Azure services

const { OpenAI } = require('openai');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

class NurseIQAgent {
  constructor() {
    this.openai = null;
    this.secretClient = null;
    this.initializeClients();
  }

  async initializeClients() {
    try {
      // Initialize Azure Key Vault for secrets
      const credential = new DefaultAzureCredential();
      const keyVaultUrl = process.env.AZURE_KEY_VAULT_URL;
      this.secretClient = new SecretClient(keyVaultUrl, credential);

      // Get OpenAI API key from Key Vault
      const openaiKey = await this.secretClient.getSecret('openai-api-key');
      
      // Initialize OpenAI client
      this.openai = new OpenAI({
        apiKey: openaiKey.value,
      });
    } catch (error) {
      console.error('Error initializing clients:', error);
    }
  }

  async processMessage(userMessage) {
    if (!this.openai) {
      return 'AI agent is not initialized yet. Please try again later.';
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are NurseIQ, an AI healthcare assistant. Provide helpful, accurate, and compassionate responses to health-related questions. Always advise consulting healthcare professionals for medical advice.'
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 150,
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error processing message:', error);
      return 'I apologize, but I encountered an error processing your request. Please try again.';
    }
  }
}

module.exports = NurseIQAgent;