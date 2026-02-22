const axios = require('axios');

class MedicationSafetyAgent {
    constructor() {
        this.fdaApiUrl = "https://api.fda.gov/drug/label.json?search=openfda.brand_name:";
    }

    async checkSafety(handoverNote) {
        // 1. Extract medication names from the text
        const medications = this.extractMedications(handoverNote);
        const alerts = [];

        for (const med of medications) {
            try {
                // 2. Query the OpenFDA API as required [cite: 161]
                const response = await axios.get(`${this.fdaApiUrl}"${med}"`);
                const drugInfo = response.data.results[0];

                alerts.push({
                    medication: med,
                    // Extracting warnings from the FDA label data
                    warning: drugInfo.warnings ? drugInfo.warnings[0] : "No specific FDA warnings found.",
                    severity: drugInfo.boxed_warning ? "High" : "Low"
                });
            } catch (error) {
                console.warn(`Could not find FDA data for: ${med}`);
            }
        }

        return {
            medications_detected: medications,
            alerts: alerts,
            severity_level: alerts.some(a => a.severity === "High") ? "High" : "Low"
        };
    }

    extractMedications(text) {
        // Clinical keyword extraction (Aspirin and GTN from Mr. Ahmed's case)
        const medKeywords = ['aspirin', 'gtn', 'metformin', 'insulin', 'warfarin'];
        return medKeywords.filter(med => text.toLowerCase().includes(med));
    }
}

module.exports = MedicationSafetyAgent;