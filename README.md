<div align="center">

# 🏥 NurseIQ

### *AI doesn't replace nurses. It gives them time back.*

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-nurseiq--app--2026.azurewebsites.net-0078D4?style=for-the-badge)](https://nurseiq-app-2026.azurewebsites.net)
[![MCP Server](https://img.shields.io/badge/🔌_MCP_Server-Active-00B294?style=for-the-badge)](https://nurseiq-app-2026.azurewebsites.net/mcp)
[![Azure](https://img.shields.io/badge/Azure-Powered-0078D4?style=for-the-badge&logo=microsoftazure)](https://azure.microsoft.com)
[![Hackathon](https://img.shields.io/badge/Microsoft_AI_Dev_Days-2026-FFB900?style=for-the-badge&logo=microsoft)](https://github.com/shubhamanawade125/nurseiq)

<br/>

> **Microsoft AI Dev Days Hackathon 2026**  
> Built by a BSc Nursing student who has stood at a patient's bedside.

</div>

---

## 💔 The Problem

Every shift, nurses spend **35–40% of their time on paperwork** — not on patients.

- 📋 A single admission note requires **8–12 screen interactions** in current EHR systems
- 💊 **1.5 million preventable medication errors** occur annually in the US
- 🔥 Over **60% of nursing staff** report burnout — documentation is a leading cause
- ⏱️ **2 hours per shift** stolen from patient care, spent writing handover notes

**No current system solves this intelligently. NurseIQ does.**

---

## ✨ What NurseIQ Does

A nurse speaks or types a handover note. In under 30 seconds, NurseIQ's AI agents produce:

| Output | Description |
|--------|-------------|
| 📄 **SOAP Clinical Note** | Structured Subjective / Objective / Assessment / Plan documentation |
| 💊 **Medication Safety Alert** | Real-time drug warnings checked against live OpenFDA database |
| 🗣️ **Patient Discharge Summary** | Plain-English instructions patients actually understand |
| 🔒 **Compliance Audit Log** | PHI detection + immutable activity trail for regulatory review |

**Try it now →** [nurseiq-app-2026.azurewebsites.net](https://nurseiq-app-2026.azurewebsites.net)

---

## 🤖 Multi-Agent Architecture

NurseIQ uses an **Orchestrator Pattern** — one central agent analyses every note and dynamically routes to specialist agents. No agent is called unless it is needed.

```
┌──────────────────────────────────────────────────────────────────┐
│                         NURSE INPUT                              │
│                   Voice or Text Handover Note                    │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    🧠 ORCHESTRATOR AGENT                         │
│          Analyses input → Routes to specialist agents            │
└──────┬──────────────┬──────────────┬──────────────┬─────────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌─────────────┐
│📄 DOCS   │   │💊 MEDS   │   │🗣️ COMMS  │   │🔒 COMPLIANCE│
│  AGENT   │   │  AGENT   │   │  AGENT   │   │   AGENT     │
│          │   │          │   │          │   │             │
│  Azure   │   │ OpenFDA  │   │  Azure   │   │ PHI detect  │
│  OpenAI  │   │   API    │   │  OpenAI  │   │  Audit log  │
└──────────┘   └──────────┘   └──────────┘   └─────────────┘
       │              │              │              │
       └──────────────┴──────────────┴──────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                      STRUCTURED OUTPUT                           │
│          SOAP Note + Drug Alerts + Discharge + Audit Log         │
└──────────────────────────────────────────────────────────────────┘
```

### The Agents

| Agent | Always Active | Trigger | Powered By |
|-------|:---:|---|---|
| **OrchestratorAgent** | ✅ | — | Keyword routing logic |
| **DocumentationAgent** | ✅ | Always generates SOAP | Azure OpenAI gpt-4o-mini |
| **MedicationSafetyAgent** | ❌ | Medication names detected | OpenFDA + Azure OpenAI |
| **PatientCommunicationAgent** | ❌ | "discharge" / "home today" | Azure OpenAI gpt-4o-mini |
| **ComplianceAuditAgent** | ✅ | Always logs + PHI checks | Custom PHI pattern matching |

---

## ☁️ Azure Technologies Used

| Service | Role in NurseIQ |
|---------|----------------|
| **Azure AI Foundry** | gpt-4o-mini model deployment for all AI generation |
| **Azure App Service B1** | Node.js 20 LTS production hosting on Linux |
| **Azure Speech Services** | Real-time voice-to-text for hands-free dictation |
| **Azure MCP** | All 4 agents exposed as callable MCP tools |

---

## 🔌 MCP Server — Every Agent as a Tool

NurseIQ exposes every clinical agent as a **Model Context Protocol (MCP) tool**, making the entire system discoverable and callable by any Azure AI service, Copilot Studio workflow, or external orchestrator.

**Live MCP Server:** `https://nurseiq-app-2026.azurewebsites.net/mcp`

```
GET  /mcp            →  Server info, version, active tool list
GET  /mcp/tools      →  Full JSON schemas for all 4 tools
POST /mcp/call       →  Execute any agent with arguments
GET  /mcp/resources  →  Agent registry and metadata
```

**Example — call the medication safety agent directly:**

```json
POST /mcp/call
{
  "tool": "check_medication_safety",
  "arguments": {
    "handover_note": "Patient on warfarin 5mg and aspirin 300mg daily"
  }
}
```

**All 4 MCP Tools:**

| Tool | What It Does |
|------|-------------|
| `generate_soap_note` | Handover note → structured SOAP clinical documentation |
| `check_medication_safety` | Drug screening via OpenFDA, returns severity rating |
| `generate_discharge_summary` | Plain-English patient discharge instructions |
| `run_compliance_audit` | PHI detection results + full timestamped audit log |

---

## 🎯 Demo Scenarios

**🫀 Scenario 1 — Acute Cardiac** *(triggers: Documentation + Medication Safety + Compliance)*
```
Mr Ahmed, 67, bed 4B, chest pain 7/10 radiating to left arm. BP 158/94, 
HR 102, RR 22, O2 sat 94% on room air. History of hypertension and type 2 
diabetes. Given aspirin 300mg and GTN spray. ECG shows ST changes. 
Cardiology informed. Patient anxious, asking about his wife.
```

**🏠 Scenario 2 — Discharge** *(triggers: all 4 agents)*
```
Mrs Johnson, 54, bed 2A, ready for discharge today. Admitted for heart 
failure. BP stable 128/82. On furosemide 40mg daily and ramipril 5mg. 
Follow up cardiology in 2 weeks. Patient educated on fluid restriction 
and daily weight monitoring.
```

---

## 🚀 Run Locally

**Prerequisites:** Node.js 20+, Azure account with AI Foundry access

```bash
git clone https://github.com/shubhamanawade125/nurseiq.git
cd nurseiq
npm install
```

Create `.env` in the project root:
```env
AZURE_OPENAI_ENDPOINT=https://your-resource.services.ai.azure.com
AZURE_OPENAI_KEY=your_key_here
AZURE_SPEECH_KEY=your_speech_key
AZURE_SPEECH_REGION=eastus
PORT=3000
```

```bash
node backend/server.js
# Open http://localhost:3000
```

---

## 📁 Project Structure

```
nurseiq/
│
├── agents/
│   ├── OrchestratorAgent.js          # Central router — decides which agents activate
│   ├── DocumentationAgent.js         # SOAP note generation via Azure OpenAI
│   ├── MedicationSafetyAgent.js      # Drug screening via OpenFDA API
│   ├── PatientCommunicationAgent.js  # Discharge summaries in plain English
│   └── ComplianceAuditAgent.js       # PHI detection + immutable audit logging
│
├── backend/
│   └── server.js                     # Express server + MCP endpoints
│
├── frontend/
│   ├── index.html                    # Clinical UI
│   ├── script.js                     # Agent output rendering
│   └── styles.css                    # Medical-grade styling
│
├── config/
│   └── mcp.json                      # MCP tool definitions and schemas
│
├── architecture.svg                  # System architecture diagram
└── package.json
```

---

## 🔒 Enterprise & Responsible AI

```
✅  AI-ASSISTED DRAFT disclaimer on every generated output
✅  PHI detection — flags patient identifiers in every note  
✅  Immutable audit trail — every agent action timestamped and logged
✅  Input validation — sanitised before reaching AI models
✅  HIPAA-aligned architecture — encrypted in transit via HTTPS
✅  No patient data stored — session-only processing, nothing persisted
```

> ⚠️ **Clinical Disclaimer:** NurseIQ is an AI-assisted tool for educational and demonstration purposes. All AI-generated clinical notes must be reviewed and verified by a qualified healthcare professional before use in any clinical setting. This system does not replace clinical judgement.

---

## 📊 The Impact

| Metric | Value |
|--------|-------|
| 🕐 Time saved per nurse per shift | Up to **2 hours** |
| 💰 Addressable market | **$8.3 billion** |
| 🏥 Annual savings per 500-bed hospital | **$2–4 million** in recovered nursing time |
| 😔 Nurses experiencing burnout | **60%** — documentation is a leading cause |

---

## 👩‍⚕️ Built By

**Shubham Anawade** — BSc Nursing Student

Every design decision in NurseIQ came from clinical placement experience. The SOAP note format, the medication severity thresholds, the PHI detection patterns, the nurse-first UX — none of this was invented by a developer who has never held a patient's hand.

*"I built the tool I wish existed when I was doing my handovers."*

---

<div align="center">

**Microsoft AI Dev Days Hackathon 2026**

`Azure OpenAI` · `Azure Speech` · `Azure MCP` · `Node.js 20` · `OpenFDA`

*For the nurses who stay late to finish their paperwork.*

---

⭐ Star this repo if NurseIQ could help a nurse you know

</div>