require('dotenv').config();
const express = require('express');
const path = require('path');

// Load OrchestratorAgent and show the REAL error if it fails
let OrchestratorAgent;
try {
    OrchestratorAgent = require('../agents/OrchestratorAgent');
    console.log("✅ OrchestratorAgent loaded successfully");
} catch (e1) {
    console.error("❌ Failed to load from ../agents/OrchestratorAgent:", e1.message);
    try {
        OrchestratorAgent = require('./agents/OrchestratorAgent');
        console.log("✅ OrchestratorAgent loaded from ./agents/");
    } catch (e2) {
        console.error("❌ Failed to load from ./agents/OrchestratorAgent:", e2.message);
        console.error("⚠️ OrchestratorAgent will not be available.");
    }
}

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Serve frontend files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Main AI processing route
app.post('/api/process-note', async (req, res) => {
    try {
        const noteText = req.body.patientNote || req.body.text || req.body.message;

        if (!noteText) {
            return res.status(400).json({ error: "No patient note provided" });
        }

        if (!OrchestratorAgent) {
            return res.status(500).json({ 
                error: "OrchestratorAgent failed to load. Check terminal for the real error message." 
            });
        }

        const orchestrator = new OrchestratorAgent();
        const aiResponse = await orchestrator.processInput(noteText);
        res.json(aiResponse);

    } catch (error) {
        console.error("❌ AI Processing Error:", error.message);
        console.error(error.stack);
        res.status(500).json({ 
            error: "Failed to process note", 
            details: error.message 
        });
    }
});

// Speech config route
app.get('/api/speech-config', (req, res) => {
    const key = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION || 'eastus';
    if (!key) {
        console.warn("⚠️ AZURE_SPEECH_KEY not found in .env");
    }
    res.json({ key, region });
});

app.listen(port, () => {
    console.log(`\n🚀 NurseIQ server running on port ${port}`);
    console.log(`📋 Open: http://localhost:${port}`);
    console.log(`🔑 Azure OpenAI configured: ${!!process.env.AZURE_OPENAI_KEY}`);
    console.log(`🎤 Azure Speech configured: ${!!process.env.AZURE_SPEECH_KEY}\n`);
});