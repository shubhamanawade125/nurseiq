require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

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

// ============================================================
// AZURE MCP (MODEL CONTEXT PROTOCOL) INTEGRATION
// ============================================================

// MCP: Server info
app.get('/mcp', (req, res) => {
    res.json({
        mcpVersion: '1.0',
        name: 'nurseiq-mcp-server',
        description: 'NurseIQ Multi-Agent Clinical AI — MCP Tool Server',
        version: '1.0.0',
        status: 'active',
        tools: [
            'generate_soap_note',
            'check_medication_safety',
            'generate_discharge_summary',
            'run_compliance_audit'
        ],
        endpoints: {
            tools_list: '/mcp/tools',
            tool_call: '/mcp/call',
            resources: '/mcp/resources'
        }
    });
});

// MCP: List available tools
app.get('/mcp/tools', (req, res) => {
    try {
        const mcpConfigPath = path.join(__dirname, '../config/mcp.json');
        const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
        res.json({ tools: mcpConfig.tools });
    } catch (err) {
        res.status(500).json({ error: 'Could not load mcp.json from config folder', details: err.message });
    }
});

// MCP: Call a tool
app.post('/mcp/call', async (req, res) => {
    const { tool, arguments: args } = req.body;

    if (!tool || !args) {
        return res.status(400).json({ error: 'Missing required fields: tool, arguments' });
    }

    try {
        const orchestrator = new OrchestratorAgent();

        switch (tool) {
            case 'generate_soap_note': {
                const result = await orchestrator.callDocumentationAgent(args.handover_note);
                return res.json({ tool, result, status: 'success', timestamp: new Date().toISOString() });
            }
            case 'check_medication_safety': {
                const MedicationSafetyAgent = require('../agents/MedicationSafetyAgent');
                const medAgent = new MedicationSafetyAgent();
                const result = await medAgent.checkSafety(args.handover_note);
                return res.json({ tool, result, status: 'success', timestamp: new Date().toISOString() });
            }
            case 'generate_discharge_summary': {
                const PatientCommunicationAgent = require('../agents/PatientCommunicationAgent');
                const soapNote = await orchestrator.callDocumentationAgent(args.handover_note);
                const commAgent = new PatientCommunicationAgent();
                const result = await commAgent.generateDischargeSummary(args.handover_note, soapNote);
                return res.json({ tool, result, status: 'success', timestamp: new Date().toISOString() });
            }
            case 'run_compliance_audit': {
                const ComplianceAuditAgent = require('../agents/ComplianceAuditAgent');
                const auditAgent = new ComplianceAuditAgent();
                const result = auditAgent.auditNoteProcessing(
                    args.handover_note,
                    args.agents_used || ['DocumentationAgent']
                );
                return res.json({ tool, result, status: 'success', timestamp: new Date().toISOString() });
            }
            default:
                return res.status(404).json({
                    error: `Unknown tool: ${tool}`,
                    available_tools: ['generate_soap_note', 'check_medication_safety', 'generate_discharge_summary', 'run_compliance_audit']
                });
        }
    } catch (error) {
        console.error('MCP tool call error:', error);
        return res.status(500).json({ error: error.message, tool, status: 'failed' });
    }
});

// MCP: List resources
app.get('/mcp/resources', (req, res) => {
    res.json({
        resources: [
            {
                uri: 'nurseiq://agents',
                name: 'NurseIQ Agent Registry',
                description: 'All available NurseIQ clinical AI agents',
                content: {
                    agents: [
                        { name: 'DocumentationAgent', capability: 'SOAP note generation via Azure OpenAI gpt-4o-mini', trigger: 'Always active' },
                        { name: 'MedicationSafetyAgent', capability: 'Drug safety checks via OpenFDA API', trigger: 'When medications detected in note' },
                        { name: 'PatientCommunicationAgent', capability: 'Patient-friendly discharge summaries', trigger: 'When discharge keywords detected' },
                        { name: 'ComplianceAuditAgent', capability: 'PHI detection and audit logging', trigger: 'Always active' }
                    ]
                }
            }
        ]
    });
});

app.listen(port, () => {
    console.log(`\n🚀 NurseIQ server running on port ${port}`);
    console.log(`📋 Open: http://localhost:${port}`);
    console.log(`🔑 Azure OpenAI configured: ${!!process.env.AZURE_OPENAI_KEY}`);
    console.log(`🎤 Azure Speech configured: ${!!process.env.AZURE_SPEECH_KEY}`);
    console.log(`🔌 MCP endpoints: /mcp | /mcp/tools | /mcp/call | /mcp/resources\n`);
});