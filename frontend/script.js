/**
 * StrokeRisk AI - Clinical Stroke Risk Assessment Platform
 * Dynamic Frontend Engine & API Client
 * 
 * NOTE: No backend URLs are hardcoded. The backend endpoint is resolved dynamically:
 * 1. From Vercel Environment Variable (BACKEND_URL) via build-time injection (window.__ENV__.BACKEND_URL)
 * 2. From Vercel Serverless Function (/api/config) reading process.env.BACKEND_URL at runtime
 * 3. From Localhost (http://localhost:8000) during local development
 * 4. From custom URL entered by user in the Settings Modal (persisted in localStorage)
 */

const DEFAULT_LOCAL_URL = 'http://localhost:8000';

// Resolve initial API Base URL
function getInitialApiUrl() {
    // 1. Build-time injected Vercel environment variable (from build.js -> config.js)
    const buildEnvUrl = (window.__ENV__ && window.__ENV__.BACKEND_URL) ? window.__ENV__.BACKEND_URL.trim() : '';
    if (buildEnvUrl) {
        return buildEnvUrl.replace(/\/+$/, '');
    }

    // 2. User manual override in browser localStorage (via Settings Modal)
    const saved = localStorage.getItem('stroke_api_url');
    if (saved && saved.trim()) {
        return saved.trim().replace(/\/+$/, '');
    }

    // 3. Local development fallback (localhost / 127.0.0.1)
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return DEFAULT_LOCAL_URL;
    }

    // 4. Leave empty initially to be resolved asynchronously from /api/config on Vercel
    return '';
}

let API_BASE_URL = getInitialApiUrl();

// DOM Elements Cache
const elements = {
    // Form & Inputs
    form: document.getElementById('predictionForm'),
    submitBtn: document.getElementById('submitBtn'),
    btnText: document.querySelector('.btn-text'),
    btnSpinner: document.querySelector('.btn-spinner'),
    renderWakeAlert: document.getElementById('renderWakeAlert'),

    // Biometric Controls
    ageSlider: document.getElementById('ageSlider'),
    ageInput: document.getElementById('ageInput'),
    ageBadge: document.getElementById('ageBadge'),
    glucoseSlider: document.getElementById('glucoseSlider'),
    glucoseInput: document.getElementById('glucoseInput'),
    glucoseBadge: document.getElementById('glucoseBadge'),
    bmiSlider: document.getElementById('bmiSlider'),
    bmiInput: document.getElementById('bmiInput'),
    bmiBadge: document.getElementById('bmiBadge'),

    // Checkboxes & Selects
    hypertensionCheckbox: document.getElementById('hypertensionCheckbox'),
    heartDiseaseCheckbox: document.getElementById('heartDiseaseCheckbox'),
    workTypeSelect: document.getElementById('work_type'),
    smokingSelect: document.getElementById('smoking_status'),

    // Status Pill
    backendStatusBtn: document.getElementById('backendStatusBtn'),
    statusLabel: document.getElementById('statusLabel'),

    // Presets
    presetHighRisk: document.getElementById('presetHighRisk'),
    presetModerateRisk: document.getElementById('presetModerateRisk'),
    presetLowRisk: document.getElementById('presetLowRisk'),
    presetReset: document.getElementById('presetReset'),

    // Results Dashboard
    resultContainer: document.getElementById('resultContainer'),
    gaugeCircle: document.getElementById('gaugeCircle'),
    probabilityNumber: document.getElementById('probabilityNumber'),
    riskTierBadge: document.getElementById('riskTierBadge'),
    predictionSummaryText: document.getElementById('predictionSummaryText'),
    riskFactorsList: document.getElementById('riskFactorsList'),
    recommendationsList: document.getElementById('recommendationsList'),
    copyResultBtn: document.getElementById('copyResultBtn'),
    printReportBtn: document.getElementById('printReportBtn'),

    // Modal
    settingsModal: document.getElementById('settingsModal'),
    openSettingsBtn: document.getElementById('openSettingsBtn'),
    footerApiLink: document.getElementById('footerApiLink'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    apiUrlInput: document.getElementById('apiUrlInput'),
    useLocalhostBtn: document.getElementById('useLocalhostBtn'),
    useVercelEnvBtn: document.getElementById('useVercelEnvBtn'),
    testConnectionBtn: document.getElementById('testConnectionBtn'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    modalStatusDot: document.getElementById('modalStatusDot'),
    modalStatusText: document.getElementById('modalStatusText'),
    modalLatencyText: document.getElementById('modalLatencyText'),

    // Toast
    toastNotification: document.getElementById('toastNotification')
};

// SVG Circumference for 80px radius circle
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 80; // ~502.65

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    initBiometricSync();
    initPresets();
    initModal();
    initForm();
    await resolveAndCheckBackend();
});

/* ==========================================================================
   Dynamic Backend URL Resolution (Vercel Environment Variable Integration)
   ========================================================================== */
async function resolveAndCheckBackend() {
    // If API_BASE_URL is not yet set from build-time injection or localStorage
    if (!API_BASE_URL) {
        setStatus('checking', 'Resolving API URL...');
        try {
            // Attempt to query Vercel serverless function which reads process.env.BACKEND_URL
            const res = await fetch('/api/config', { method: 'GET' });
            if (res.ok) {
                const data = await res.json();
                if (data.apiUrl && data.apiUrl.trim()) {
                    API_BASE_URL = data.apiUrl.trim().replace(/\/+$/, '');
                    elements.apiUrlInput.value = API_BASE_URL;
                    console.log('[StrokeRisk] Resolved backend URL from Vercel environment:', API_BASE_URL);
                }
            }
        } catch (e) {
            console.warn('[StrokeRisk] /api/config endpoint unavailable:', e);
        }
    }

    if (!API_BASE_URL) {
        setStatus('offline', 'Set BACKEND_URL in Vercel');
        return;
    }

    elements.apiUrlInput.value = API_BASE_URL;
    checkBackendHealth();
}

/* ==========================================================================
   Biometrics Sync & Real-Time Clinical Classification
   ========================================================================== */
function initBiometricSync() {
    // Age Sync
    elements.ageSlider.addEventListener('input', (e) => {
        elements.ageInput.value = e.target.value;
        updateAgeCategory(parseFloat(e.target.value));
    });
    elements.ageInput.addEventListener('input', (e) => {
        elements.ageSlider.value = e.target.value;
        updateAgeCategory(parseFloat(e.target.value));
    });

    // Glucose Sync
    elements.glucoseSlider.addEventListener('input', (e) => {
        elements.glucoseInput.value = parseFloat(e.target.value).toFixed(1);
        updateGlucoseCategory(parseFloat(e.target.value));
    });
    elements.glucoseInput.addEventListener('input', (e) => {
        elements.glucoseSlider.value = e.target.value;
        updateGlucoseCategory(parseFloat(e.target.value));
    });

    // BMI Sync
    elements.bmiSlider.addEventListener('input', (e) => {
        elements.bmiInput.value = parseFloat(e.target.value).toFixed(1);
        updateBmiCategory(parseFloat(e.target.value));
    });
    elements.bmiInput.addEventListener('input', (e) => {
        elements.bmiSlider.value = e.target.value;
        updateBmiCategory(parseFloat(e.target.value));
    });

    // Initial categorization calls
    updateAgeCategory(parseFloat(elements.ageInput.value));
    updateGlucoseCategory(parseFloat(elements.glucoseInput.value));
    updateBmiCategory(parseFloat(elements.bmiInput.value));
}

function updateAgeCategory(age) {
    if (isNaN(age)) return;
    if (age < 35) {
        setTag(elements.ageBadge, 'Young Adult (<35)', 'tag-normal');
    } else if (age < 55) {
        setTag(elements.ageBadge, 'Middle-Aged (35–54)', 'tag-normal');
    } else if (age < 70) {
        setTag(elements.ageBadge, 'Elevated Age Risk (55–69)', 'tag-elevated');
    } else {
        setTag(elements.ageBadge, 'High Vascular Age (70+)', 'tag-high');
    }
}

function updateGlucoseCategory(glucose) {
    if (isNaN(glucose)) return;
    if (glucose < 140) {
        setTag(elements.glucoseBadge, 'Normal Fasting (<140)', 'tag-normal');
    } else if (glucose < 200) {
        setTag(elements.glucoseBadge, 'Prediabetic Range (140–199)', 'tag-elevated');
    } else {
        setTag(elements.glucoseBadge, 'Diabetic / Hyperglycemic (200+)', 'tag-high');
    }
}

function updateBmiCategory(bmi) {
    if (isNaN(bmi)) return;
    if (bmi < 18.5) {
        setTag(elements.bmiBadge, 'Underweight (<18.5)', 'tag-elevated');
    } else if (bmi < 25) {
        setTag(elements.bmiBadge, 'Normal Weight (18.5–24.9)', 'tag-normal');
    } else if (bmi < 30) {
        setTag(elements.bmiBadge, 'Overweight (25–29.9)', 'tag-elevated');
    } else {
        setTag(elements.bmiBadge, 'Class I/II Obesity (30+)', 'tag-high');
    }
}

function setTag(element, text, className) {
    element.textContent = text;
    element.className = `clinical-tag ${className}`;
}

/* ==========================================================================
   Quick Profiles / Presets
   ========================================================================== */
function initPresets() {
    elements.presetHighRisk.addEventListener('click', () => {
        applyProfile({
            gender: 'Male',
            age: 78,
            ever_married: '1',
            residence_type: 'Urban',
            work_type: 'Self-employed',
            glucose: 242.0,
            bmi: 38.5,
            hypertension: true,
            heart_disease: true,
            smoking: 'smokes'
        });
        showToast('Loaded High Risk Patient Profile');
    });

    elements.presetModerateRisk.addEventListener('click', () => {
        applyProfile({
            gender: 'Female',
            age: 58,
            ever_married: '1',
            residence_type: 'Urban',
            work_type: 'Private',
            glucose: 165.0,
            bmi: 28.5,
            hypertension: true,
            heart_disease: false,
            smoking: 'formerly smoked'
        });
        showToast('Loaded Moderate Risk Profile');
    });

    elements.presetLowRisk.addEventListener('click', () => {
        applyProfile({
            gender: 'Female',
            age: 22,
            ever_married: '0',
            residence_type: 'Rural',
            work_type: 'Private',
            glucose: 82.0,
            bmi: 21.4,
            hypertension: false,
            heart_disease: false,
            smoking: 'never smoked'
        });
        showToast('Loaded Healthy Patient Baseline');
    });

    elements.presetReset.addEventListener('click', () => {
        applyProfile({
            gender: 'Male',
            age: 45,
            ever_married: '1',
            residence_type: 'Urban',
            work_type: 'Private',
            glucose: 95.0,
            bmi: 24.5,
            hypertension: false,
            heart_disease: false,
            smoking: 'never smoked'
        });
        elements.resultContainer.style.display = 'none';
        showToast('Form Reset to Defaults');
    });
}

function applyProfile(p) {
    const genderRadio = document.querySelector(`input[name="gender"][value="${p.gender}"]`);
    if (genderRadio) genderRadio.checked = true;

    elements.ageSlider.value = p.age;
    elements.ageInput.value = p.age;
    updateAgeCategory(p.age);

    const marriedRadio = document.querySelector(`input[name="ever_married"][value="${p.ever_married}"]`);
    if (marriedRadio) marriedRadio.checked = true;

    const residenceRadio = document.querySelector(`input[name="residence_type"][value="${p.residence_type}"]`);
    if (residenceRadio) residenceRadio.checked = true;

    elements.workTypeSelect.value = p.work_type;

    elements.glucoseSlider.value = p.glucose;
    elements.glucoseInput.value = p.glucose.toFixed(1);
    updateGlucoseCategory(p.glucose);

    elements.bmiSlider.value = p.bmi;
    elements.bmiInput.value = p.bmi.toFixed(1);
    updateBmiCategory(p.bmi);

    elements.hypertensionCheckbox.checked = p.hypertension;
    elements.heartDiseaseCheckbox.checked = p.heart_disease;
    elements.smokingSelect.value = p.smoking;
}

/* ==========================================================================
   Backend Health Check & Status Pill
   ========================================================================== */
async function checkBackendHealth() {
    if (!API_BASE_URL) {
        setStatus('offline', 'Set BACKEND_URL in Vercel');
        return;
    }

    setStatus('checking', 'Connecting...');
    const startTime = performance.now();
    try {
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        const latency = Math.round(performance.now() - startTime);

        if (response.ok) {
            const hostType = API_BASE_URL.includes('localhost') ? 'Local' : 'Cloud';
            setStatus('online', `${hostType} (${latency}ms)`);
            return { ok: true, latency };
        } else {
            setStatus('offline', `API Error (HTTP ${response.status})`);
            return { ok: false, latency };
        }
    } catch (err) {
        setStatus('offline', 'Offline (Click to setup)');
        return { ok: false, error: err };
    }
}

function setStatus(state, label) {
    elements.backendStatusBtn.className = `status-pill ${state}`;
    elements.statusLabel.textContent = label;
}

/* ==========================================================================
   Form Submission & ML Inference
   ========================================================================== */
function initForm() {
    elements.form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Check if backend URL is configured
        if (!API_BASE_URL) {
            showToast('Backend URL not configured. Please add BACKEND_URL in Vercel or configure in Settings.', true);
            openModal();
            return;
        }

        // Extract and structure data
        const formData = new FormData(elements.form);
        const payload = {
            gender: formData.get('gender') || 'Male',
            age: parseFloat(elements.ageInput.value),
            hypertension: elements.hypertensionCheckbox.checked ? 1 : 0,
            heart_disease: elements.heartDiseaseCheckbox.checked ? 1 : 0,
            ever_married: parseInt(formData.get('ever_married') || '1'),
            work_type: elements.workTypeSelect.value,
            residence_type: formData.get('residence_type') || 'Urban',
            avg_glucose_level: parseFloat(elements.glucoseInput.value),
            bmi: parseFloat(elements.bmiInput.value),
            smoking_status: elements.smokingSelect.value
        };

        // UI Loading state
        setLoading(true);

        // Cold-start warning timer: If Render is hibernating, notify user after 2.5s
        const coldStartTimer = setTimeout(() => {
            elements.renderWakeAlert.style.display = 'flex';
        }, 2500);

        try {
            const response = await fetch(`${API_BASE_URL}/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            clearTimeout(coldStartTimer);
            elements.renderWakeAlert.style.display = 'none';

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Server error: HTTP ${response.status}`);
            }

            const result = await response.json();
            displayAssessmentResult(result, payload);

        } catch (error) {
            clearTimeout(coldStartTimer);
            elements.renderWakeAlert.style.display = 'none';
            console.error('Prediction request failed:', error);
            showToast(`Assessment failed: ${error.message}. Check API Settings.`, true);
            openModal();
        } finally {
            setLoading(false);
        }
    });

    // Report actions
    elements.printReportBtn.addEventListener('click', () => {
        window.print();
    });

    elements.copyResultBtn.addEventListener('click', () => {
        copySummaryText();
    });
}

function setLoading(isLoading) {
    if (isLoading) {
        elements.btnText.style.display = 'none';
        elements.btnSpinner.style.display = 'block';
        elements.submitBtn.disabled = true;
    } else {
        elements.btnText.style.display = 'flex';
        elements.btnSpinner.style.display = 'none';
        elements.submitBtn.disabled = false;
    }
}

/* ==========================================================================
   Results Display & Gauge Animation
   ========================================================================== */
function displayAssessmentResult(result, inputData) {
    const { prediction, probability, risk_level, risk_factors, recommendations } = result;

    elements.resultContainer.style.display = 'block';
    animateGauge(probability, risk_level);

    elements.riskTierBadge.textContent = `${risk_level} Stroke Risk`;
    elements.riskTierBadge.className = `risk-tier-badge tier-${risk_level.toLowerCase()}`;

    if (prediction === 1 || risk_level === 'High') {
        elements.predictionSummaryText.textContent =
            `Classification: Elevated cardiovascular stroke risk detected (${(probability * 100).toFixed(1)}%). Clinical follow-up strongly advised.`;
    } else if (risk_level === 'Medium') {
        elements.predictionSummaryText.textContent =
            `Classification: Moderate stroke risk profile (${(probability * 100).toFixed(1)}%). Lifestyle and biomarker monitoring advised.`;
    } else {
        elements.predictionSummaryText.textContent =
            `Classification: Low stroke risk detected (${(probability * 100).toFixed(1)}%). Biometric indicators are within non-elevated thresholds.`;
    }

    elements.riskFactorsList.innerHTML = '';
    if (risk_factors && risk_factors.length > 0) {
        risk_factors.forEach(factor => {
            const li = document.createElement('li');
            li.textContent = factor;
            elements.riskFactorsList.appendChild(li);
        });
    }

    elements.recommendationsList.innerHTML = '';
    if (recommendations && recommendations.length > 0) {
        recommendations.forEach(rec => {
            const li = document.createElement('li');
            li.textContent = rec;
            elements.recommendationsList.appendChild(li);
        });
    }

    elements.resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function animateGauge(probability, riskLevel) {
    const targetOffset = CIRCLE_CIRCUMFERENCE * (1 - probability);
    const targetPercent = probability * 100;

    const strokeColors = {
        'Low': '#10B981',
        'Medium': '#F59E0B',
        'High': '#F43F5E'
    };
    elements.gaugeCircle.style.stroke = strokeColors[riskLevel] || '#10B981';
    elements.gaugeCircle.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE;

    setTimeout(() => {
        elements.gaugeCircle.style.strokeDashoffset = targetOffset;
    }, 50);

    let currentPercent = 0;
    const duration = 1000;
    const startTime = performance.now();

    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - (1 - progress) * (1 - progress);
        currentPercent = easeProgress * targetPercent;
        elements.probabilityNumber.textContent = `${currentPercent.toFixed(1)}%`;

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            elements.probabilityNumber.textContent = `${targetPercent.toFixed(1)}%`;
        }
    }
    requestAnimationFrame(updateCounter);
}

function copySummaryText() {
    const prob = elements.probabilityNumber.textContent;
    const tier = elements.riskTierBadge.textContent;
    const factors = Array.from(elements.riskFactorsList.querySelectorAll('li')).map(li => `• ${li.textContent}`).join('\n');
    const recs = Array.from(elements.recommendationsList.querySelectorAll('li')).map(li => `• ${li.textContent}`).join('\n');

    const summary = `--- STROKERISK AI CLINICAL ASSESSMENT REPORT ---
Risk Level: ${tier}
Stroke Probability: ${prob}
Key Factors:
${factors}

Recommendations:
${recs}
Generated: ${new Date().toLocaleString()}
------------------------------------------------`;

    navigator.clipboard.writeText(summary)
        .then(() => showToast('Assessment report copied to clipboard!'))
        .catch(() => showToast('Failed to copy to clipboard', true));
}

/* ==========================================================================
   API Settings Modal Management
   ========================================================================== */
function initModal() {
    elements.apiUrlInput.value = API_BASE_URL;

    elements.openSettingsBtn.addEventListener('click', openModal);
    elements.backendStatusBtn.addEventListener('click', openModal);
    if (elements.footerApiLink) {
        elements.footerApiLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }

    elements.closeSettingsBtn.addEventListener('click', closeModal);
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) closeModal();
    });

    elements.useLocalhostBtn.addEventListener('click', () => {
        elements.apiUrlInput.value = DEFAULT_LOCAL_URL;
    });

    elements.useVercelEnvBtn.addEventListener('click', async () => {
        // Clear manual localStorage override and re-read from Vercel env
        localStorage.removeItem('stroke_api_url');
        API_BASE_URL = '';
        await resolveAndCheckBackend();
        elements.apiUrlInput.value = API_BASE_URL;
        showToast(API_BASE_URL ? 'Reset to Vercel BACKEND_URL' : 'No Vercel BACKEND_URL found');
    });

    elements.testConnectionBtn.addEventListener('click', async () => {
        const testUrl = elements.apiUrlInput.value.trim().replace(/\/+$/, '');
        if (!testUrl) {
            elements.modalStatusText.textContent = 'Please enter an API URL to test';
            return;
        }

        elements.modalStatusText.textContent = 'Testing connection...';
        elements.modalStatusDot.className = 'status-dot';
        elements.modalStatusDot.style.background = '#F59E0B';
        elements.modalLatencyText.textContent = 'Latency: --';

        const start = performance.now();
        try {
            const resp = await fetch(`${testUrl}/health`, {
                headers: { 'Accept': 'application/json' }
            });
            const latency = Math.round(performance.now() - start);

            if (resp.ok) {
                elements.modalStatusDot.style.background = '#10B981';
                elements.modalStatusText.textContent = `Online & Model Ready (HTTP ${resp.status})`;
                elements.modalLatencyText.textContent = `Latency: ${latency}ms`;
            } else {
                elements.modalStatusDot.style.background = '#F43F5E';
                elements.modalStatusText.textContent = `Server responded with HTTP ${resp.status}`;
                elements.modalLatencyText.textContent = `Latency: ${latency}ms`;
            }
        } catch (err) {
            elements.modalStatusDot.style.background = '#F43F5E';
            elements.modalStatusText.textContent = 'Failed to connect. Check URL or wait if server is waking up.';
            elements.modalLatencyText.textContent = 'Latency: Timeout/Failed';
        }
    });

    elements.saveSettingsBtn.addEventListener('click', () => {
        const newUrl = elements.apiUrlInput.value.trim().replace(/\/+$/, '');
        if (!newUrl) {
            showToast('Please enter a valid API URL', true);
            return;
        }
        API_BASE_URL = newUrl;
        localStorage.setItem('stroke_api_url', newUrl);
        showToast(`API URL updated: ${newUrl}`);
        closeModal();
        checkBackendHealth();
    });
}

function openModal() {
    elements.apiUrlInput.value = API_BASE_URL;
    elements.settingsModal.style.display = 'flex';
}

function closeModal() {
    elements.settingsModal.style.display = 'none';
}

/* ==========================================================================
   Toast Notification System
   ========================================================================== */
let toastTimeout = null;
function showToast(message, isError = false) {
    if (toastTimeout) clearTimeout(toastTimeout);
    elements.toastNotification.textContent = message;
    elements.toastNotification.style.borderColor = isError ? 'rgba(244, 63, 94, 0.5)' : 'rgba(16, 185, 129, 0.5)';
    elements.toastNotification.style.display = 'block';

    toastTimeout = setTimeout(() => {
        elements.toastNotification.style.display = 'none';
    }, 3500);
}
