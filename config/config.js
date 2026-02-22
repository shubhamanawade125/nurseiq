// Configuration file for NurseIQ
// Environment variables and settings

module.exports = {
  port: process.env.PORT || 3000,
  azure: {
    keyVaultUrl: process.env.AZURE_KEY_VAULT_URL,
    subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
  },
  openai: {
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  },
  // Add more configuration as needed
};