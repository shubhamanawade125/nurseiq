const axios = require('axios');

class MedicationSafetyAgent {
    constructor() {
        this.fdaApiUrl = 'https://api.fda.gov/drug/label.json';

        // Translate nursing shorthand → FDA generic names
        this.drugNameMap = {
            'gtn':        'nitroglycerin',
            'aspirin':    'aspirin',
            'metformin':  'metformin',
            'insulin':    'insulin',
            'warfarin':   'warfarin',
            'furosemide': 'furosemide',
            'ramipril':   'ramipril',
            'paracetamol':'acetaminophen',
            'amlodipine': 'amlodipine',
            'atorvastatin':'atorvastatin',
            'omeprazole': 'omeprazole',
            'morphine':   'morphine',
            'heparin':    'heparin',
            'enoxaparin': 'enoxaparin',
            'salbutamol': 'albuterol',
            'digoxin':    'digoxin',
            'amiodarone': 'amiodarone',
            'clopidogrel':'clopidogrel'
        };
    }

    async checkSafety(handoverNote) {
        const medications = this.extractMedications(handoverNote);
        const alerts = [];

        for (const med of medications) {
            const fdaName = this.drugNameMap[med.toLowerCase()] || med;

            try {
                // Try generic name search first
                let drugInfo = await this.fetchFDAData(fdaName);

                // Fallback: try brand name search
                if (!drugInfo) {
                    drugInfo = await this.fetchFDAData(med, 'brand');
                }

                if (drugInfo) {
                    alerts.push({
                        medication: med.toUpperCase(),
                        fdaName: fdaName,
                        warning: drugInfo.warnings ? drugInfo.warnings[0].substring(0, 300) + '...' : 
                                 drugInfo.warnings_and_cautions ? drugInfo.warnings_and_cautions[0].substring(0, 300) + '...' :
                                 'No specific warnings listed.',
                        severity: drugInfo.boxed_warning ? 'High' : 'Low',
                        boxedWarning: drugInfo.boxed_warning ? drugInfo.boxed_warning[0].substring(0, 200) + '...' : null
                    });
                } else {
                    // Still show the drug was detected even if FDA data not found
                    alerts.push({
                        medication: med.toUpperCase(),
                        fdaName: fdaName,
                        warning: 'FDA label data not available for this drug. Verify with formulary.',
                        severity: 'Unknown',
                        boxedWarning: null
                    });
                }
            } catch (error) {
                console.warn(`FDA lookup error for ${med} (${fdaName}):`, error.message);
                alerts.push({
                    medication: med.toUpperCase(),
                    fdaName: fdaName,
                    warning: 'Could not retrieve FDA data. Check drug interactions manually.',
                    severity: 'Unknown',
                    boxedWarning: null
                });
            }
        }

        // Check for known dangerous combinations
        const interactions = this.checkInteractions(medications);

        return {
            medications_detected: medications.map(m => m.toUpperCase()),
            alerts: alerts,
            interactions: interactions,
            severity_level: alerts.some(a => a.severity === 'High') ? 'High' :
                            interactions.length > 0 ? 'Medium' : 'Low'
        };
    }

    async fetchFDAData(drugName, type = 'generic') {
        try {
            const searchField = type === 'generic' 
                ? 'openfda.generic_name' 
                : 'openfda.brand_name';
            
            const url = `${this.fdaApiUrl}?search=${searchField}:"${drugName}"&limit=1`;
            const response = await axios.get(url, { timeout: 5000 });
            
            if (response.data.results && response.data.results.length > 0) {
                return response.data.results[0];
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    checkInteractions(medications) {
        const interactions = [];
        const meds = medications.map(m => m.toLowerCase());

        // Aspirin + GTN/Nitroglycerin — hypotension risk
        if (meds.includes('aspirin') && meds.includes('gtn')) {
            interactions.push({
                drugs: ['ASPIRIN', 'GTN'],
                risk: 'Additive hypotension — monitor BP closely. Both agents vasodilate.',
                severity: 'Medium'
            });
        }

        // Warfarin + Aspirin — bleeding risk
        if (meds.includes('warfarin') && meds.includes('aspirin')) {
            interactions.push({
                drugs: ['WARFARIN', 'ASPIRIN'],
                risk: 'HIGH bleeding risk — dual anticoagulant/antiplatelet therapy. Monitor INR.',
                severity: 'High'
            });
        }

        // Metformin + contrast risk flag
        if (meds.includes('metformin')) {
            interactions.push({
                drugs: ['METFORMIN'],
                risk: 'Hold if contrast imaging planned — risk of lactic acidosis.',
                severity: 'Medium'
            });
        }

        // Insulin + other medications
        if (meds.includes('insulin') && meds.includes('metformin')) {
            interactions.push({
                drugs: ['INSULIN', 'METFORMIN'],
                risk: 'Hypoglycaemia risk — monitor blood glucose frequently.',
                severity: 'Medium'
            });
        }

        return interactions;
    }

    extractMedications(text) {
        const knownMeds = Object.keys(this.drugNameMap);
        const found = knownMeds.filter(med => 
            text.toLowerCase().includes(med.toLowerCase())
        );
        return [...new Set(found)]; // remove duplicates
    }
}

module.exports = MedicationSafetyAgent;