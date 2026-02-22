const DocumentationAgent = require('./agents/DocumentationAgent');

async function testDocumentationAgent() {
  try {
    console.log('Initializing DocumentationAgent...');
    const agent = new DocumentationAgent();

    const handoverNote = 'Mr. Ahmed, 67 years old in bed 4B, came in last night with chest pain and shortness of breath. He says the pain is 7 out of 10 and radiates to his left arm. BP was 158/94, HR 102, RR 22, O2 sat 94% on room air. He has a history of hypertension and type 2 diabetes. He was given aspirin 300mg and GTN spray. ECG showed ST changes. Cardiology has been informed. He is anxious and asking about his wife.';

    console.log('Processing handover note...');
    console.log('Input:', handoverNote);
    console.log('---');

    const result = await agent.processHandoverNote(handoverNote);

    console.log('SOAP Note Generated Successfully:');
    console.log('================================');
    console.log('Patient Name:', result.patientName);
    console.log('Ward:', result.ward);
    console.log('Timestamp:', result.timestamp);
    console.log('');
    console.log('SUBJECTIVE:');
    console.log(result.subjective);
    console.log('');
    console.log('OBJECTIVE:');
    console.log(result.objective);
    console.log('');
    console.log('ASSESSMENT:');
    console.log(result.assessment);
    console.log('');
    console.log('PLAN:');
    console.log(result.plan);
    console.log('');
    console.log('Full JSON Output:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testDocumentationAgent();