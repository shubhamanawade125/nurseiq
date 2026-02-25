// --- CHAT UI & API CONNECTION ---
const sendBtn = document.getElementById('send-button');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');

function addMessage(text, isBot = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isBot ? 'bot-message' : 'user-message'}`;
    msgDiv.innerHTML = `<div class="message-content">${text}</div>`;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgDiv;
}

function formatMedicationAlerts(medSafety) {
    if (!medSafety) return '';

    const severity = medSafety.severity_level || 'Low';
    const severityColor = severity === 'High' || severity === 'Critical' ? '#A4262C' : '#107C10';
    const severityIcon = severity === 'High' || severity === 'Critical' ? '🔴' : '🟢';

    let html = `<hr style="margin: 12px 0; border-color: #ccc;">`;
    html += `<b>💊 Medication Safety Check</b><br><br>`;

    if (medSafety.medications_detected && medSafety.medications_detected.length > 0) {
        html += `<b>Detected:</b> ${medSafety.medications_detected.join(', ')}<br><br>`;
    } else {
        html += `<b>Detected:</b> No known medications flagged<br><br>`;
    }

    if (medSafety.alerts && medSafety.alerts.length > 0) {
        medSafety.alerts.forEach(alert => {
            const alertColor = alert.severity === 'High' ? '#A4262C' : '#107C10';
            const alertIcon = alert.severity === 'High' ? '⚠️' : '✅';
            html += `<div style="border-left: 4px solid ${alertColor}; padding: 6px 10px; margin-bottom: 8px; background: #f9f9f9; border-radius: 4px;">`;
            html += `${alertIcon} <b>${alert.medication.toUpperCase()}</b> — Severity: <span style="color:${alertColor}"><b>${alert.severity}</b></span><br>`;
            html += `<span style="font-size: 0.9em;">${alert.warning ? alert.warning.substring(0, 200) + '...' : 'No specific FDA warnings found.'}</span>`;
            html += `</div>`;
        });
    } else {
        html += `✅ <span style="color: #107C10;">No drug interaction alerts found.</span><br>`;
    }

    html += `<br><b>Overall Severity:</b> <span style="color: ${severityColor}; font-weight: bold;">${severityIcon} ${severity}</span>`;
    return html;
}

function formatPatientComms(comms) {
    if (!comms || !comms.success) return '';

    let html = `<hr style="margin: 12px 0; border-color: #ccc;">`;
    html += `<b>📋 Patient Discharge Summary</b><br><br>`;

    if (comms.patientInstructions) {
        html += `<div style="border-left: 4px solid #0078D4; padding: 6px 10px; margin-bottom: 8px; background: #f0f7ff; border-radius: 4px;">`;
        html += `<b>📝 Instructions:</b><br>${comms.patientInstructions}`;
        html += `</div>`;
    }

    if (comms.medications) {
        html += `<div style="border-left: 4px solid #107C10; padding: 6px 10px; margin-bottom: 8px; background: #f0fff0; border-radius: 4px;">`;
        html += `<b>💊 Medications:</b><br>${comms.medications}`;
        html += `</div>`;
    }

    if (comms.warningSigns) {
        html += `<div style="border-left: 4px solid #A4262C; padding: 6px 10px; margin-bottom: 8px; background: #fff0f0; border-radius: 4px;">`;
        html += `<b>⚠️ Warning Signs — Return to Hospital if:</b><br>${comms.warningSigns}`;
        html += `</div>`;
    }

    if (comms.followUp) {
        html += `<div style="border-left: 4px solid #8764B8; padding: 6px 10px; margin-bottom: 8px; background: #f8f0ff; border-radius: 4px;">`;
        html += `<b>📅 Follow-up:</b><br>${comms.followUp}`;
        html += `</div>`;
    }

    if (comms.dietActivity) {
        html += `<div style="border-left: 4px solid #FF8C00; padding: 6px 10px; margin-bottom: 8px; background: #fff8f0; border-radius: 4px;">`;
        html += `<b>🥗 Diet & Activity:</b><br>${comms.dietActivity}`;
        html += `</div>`;
    }

    return html;
}

sendBtn.addEventListener('click', async () => {
    const noteText = userInput.value.trim();
    if (!noteText) return;

    addMessage(noteText, false);
    userInput.value = '';

    const thinkingMsg = addMessage(`
        <i>🧠 Orchestrator analysing note...</i><br>
        <small style="color:#0078D4;">▶ Documentation Agent activating...</small>
    `, true);

    try {
        const response = await fetch('/api/process-note', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patientNote: noteText })
        });

        if (!response.ok) throw new Error('Server returned an error');
        const data = await response.json();

        // --- SOAP Note ---
        let formattedHtml = `<b>✅ Clinical Documentation Processed</b><br>`;
        formattedHtml += `<div style="background:#fff3cd; color:#856404; padding:6px 10px; border-radius:4px; margin: 8px 0; font-size:0.85em;">
            ⚠️ <b>AI-ASSISTED DRAFT:</b> This note was generated by NurseIQ AI and must be reviewed and verified by a qualified nurse before use.
        </div>`;

        const soap = data.soapNote || data;

        if (soap.patientName) formattedHtml += `<b>Patient:</b> ${soap.patientName}<br><br>`;
        if (soap.subjective) formattedHtml += `<b>S (Subjective):</b><br>${soap.subjective}<br><br>`;
        if (soap.objective)  formattedHtml += `<b>O (Objective):</b><br>${soap.objective}<br><br>`;
        if (soap.assessment) formattedHtml += `<b>A (Assessment):</b><br>${soap.assessment}<br><br>`;
        if (soap.plan)       formattedHtml += `<b>P (Plan):</b><br>${soap.plan}`;

        // --- Medication Safety Alerts ---
        const medSafety = data.medicationSafety || data.medications || null;
        formattedHtml += formatMedicationAlerts(medSafety);

        // --- Patient Communications (if present) ---
        const comms = data.patientCommunication || data.communication || null;
        formattedHtml += formatPatientComms(comms);

        if (!soap.subjective && !soap.objective && !soap.assessment && !soap.plan) {
            formattedHtml += `<pre style="white-space: pre-wrap; font-family: inherit; font-size:0.85em;">${JSON.stringify(data, null, 2)}</pre>`;
        }

        thinkingMsg.innerHTML = `<div class="message-content">${formattedHtml}</div>`;

    } catch (error) {
        console.error('Fetch error:', error);
        thinkingMsg.innerHTML = `<div class="message-content" style="color: red;">❌ Error connecting to NurseIQ AI. Check terminal for details.<br><small>${error.message}</small></div>`;
    }
});

// --- AZURE SPEECH-TO-TEXT ---
const startRecBtn = document.getElementById('startRecBtn');
const stopRecBtn  = document.getElementById('stopRecBtn');
const recordingIndicator = document.getElementById('recordingIndicator');

let recognizer;

if (startRecBtn && stopRecBtn && recordingIndicator) {
    startRecBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/speech-config');
            const configData = await response.json();

            if (!configData.key) {
                alert("Azure Speech key not configured in .env file.\nAdd: AZURE_SPEECH_KEY=your_key\nAZURE_SPEECH_REGION=eastus");
                return;
            }

            const speechConfig = window.SpeechSDK.SpeechConfig.fromSubscription(configData.key, configData.region);
            speechConfig.speechRecognitionLanguage = "en-US";
            const audioConfig = window.SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

            recognizer = new window.SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

            startRecBtn.style.display = 'none';
            stopRecBtn.style.display = 'inline-block';
            recordingIndicator.style.display = 'block';

            recognizer.recognized = (s, e) => {
                if (e.result.reason === window.SpeechSDK.ResultReason.RecognizedSpeech) {
                    userInput.value += (userInput.value ? " " : "") + e.result.text;
                }
            };

            recognizer.startContinuousRecognitionAsync(
                () => console.log("🎤 Recording started"),
                (err) => {
                    console.error("Speech start error:", err);
                    alert("Microphone error: " + err);
                    startRecBtn.style.display = 'inline-block';
                    stopRecBtn.style.display = 'none';
                    recordingIndicator.style.display = 'none';
                }
            );

        } catch (error) {
            console.error("Microphone error:", error);
            alert("Could not start microphone: " + error.message);
        }
    });

    stopRecBtn.addEventListener('click', () => {
        if (recognizer) {
            recognizer.stopContinuousRecognitionAsync(() => {
                startRecBtn.style.display = 'inline-block';
                stopRecBtn.style.display = 'none';
                recordingIndicator.style.display = 'none';
                recognizer = null;
            });
        }
    });
} else {
    if (!startRecBtn) console.warn("⚠️ Element #startRecBtn not found in HTML");
    if (!stopRecBtn)  console.warn("⚠️ Element #stopRecBtn not found in HTML");
    if (!recordingIndicator) console.warn("⚠️ Element #recordingIndicator not found in HTML");
}