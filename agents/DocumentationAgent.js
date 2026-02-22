async callDocumentationAgent(input) {
    this.onThinkingUpdate('Consulting Azure OpenAI for clinical analysis...');
    
    try {
        const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
        const client = new OpenAIClient(
            process.env.AZURE_OPENAI_ENDPOINT, 
            new AzureKeyCredential(process.env.AZURE_OPENAI_KEY)
        );

        const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
        
        const prompt = `You are a professional clinical scribe. Convert the following nurse handover note into a structured SOAP note JSON format with the keys: patientName, subjective, objective, assessment, plan. 
        Note: ${input}`;

        const result = await client.getChatCompletions(deploymentName, [
            { role: "system", content: "You are a medical assistant that outputs JSON." },
            { role: "user", content: prompt }
        ]);

        // Parse the AI's response
        return JSON.parse(result.choices[0].message.content);
    } catch (error) {
        this.log("AI Scribe Error: " + error.message);
        // Fallback in case of API failure
        return { subjective: "Error processing note", plan: "Please try again." };
    }
}