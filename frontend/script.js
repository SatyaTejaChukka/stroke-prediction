// API Configuration
const API_BASE_URL = 'http://localhost:8000';


const form = document.getElementById('predictionForm');
const resultContainer = document.getElementById('resultContainer');
const resultContent = document.getElementById('resultContent');
const submitBtn = document.querySelector('.submit-btn');
const btnText = document.querySelector('.btn-text');
const loadingSpinner = document.querySelector('.loading-spinner');


form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    
    showLoading(true);
    hideResult();
    
    try {
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        
        const processedData = {
            gender: data.gender,
            age: parseFloat(data.age),
            hypertension: parseInt(data.hypertension),
            heart_disease: parseInt(data.heart_disease),
            ever_married: parseInt(data.ever_married),
            work_type: data.work_type,
            residence_type: data.residence_type,
            avg_glucose_level: parseFloat(data.avg_glucose_level),
            bmi: parseFloat(data.bmi),
            smoking_status: data.smoking_status
        };
        
        // Make API call
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(processedData)
        });
        
        if (!response.ok) {
            throw new Error('Prediction failed');
        }
        
        const result = await response.json();
        displayResult(result);
        
    } catch (error) {
        console.error('Error:', error);
        displayError('Failed to get prediction. Please try again.');
    } finally {
        showLoading(false);
    }
});


function displayResult(result) {
    const { prediction, probability, risk_level } = result;
    
    const riskClass = risk_level.toLowerCase();
    const riskColor = {
        'low': '#10b981',
        'medium': '#f59e0b',
        'high': '#ef4444'
    };
    
    resultContent.innerHTML = `
        <div class="risk-indicator risk-${riskClass}">
            ${risk_level} Risk
        </div>
        <div class="probability-display" style="color: ${riskColor[riskClass]}">
            ${(probability * 100).toFixed(1)}%
        </div>
        <p>Stroke Risk Probability</p>
        <div style="margin-top: 1rem;">
            <p><strong>Prediction:</strong> ${prediction === 1 ? 'Stroke Risk Detected' : 'No Stroke Risk'}</p>
        </div>
    `;
    
    showResult();
}


function displayError(message) {
    resultContent.innerHTML = `
        <div style="color: #ef4444; padding: 1rem; border: 1px solid #ef4444; border-radius: 0.5rem;">
            <strong>Error:</strong> ${message}
        </div>
    `;
    showResult();
}


function showLoading(isLoading) {
    if (isLoading) {
        btnText.style.display = 'none';
        loadingSpinner.style.display = 'block';
        submitBtn.disabled = true;
    } else {
        btnText.style.display = 'block';
        loadingSpinner.style.display = 'none';
        submitBtn.disabled = false;
    }
}


function showResult() {
    resultContainer.style.display = 'block';
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


function hideResult() {
    resultContainer.style.display = 'none';
}


document.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
        if (!this.value) {
            this.parentElement.classList.remove('focused');
        }
    });
});


function validateForm() {
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value) {
            input.classList.add('error');
            isValid = false;
        } else {
            input.classList.remove('error');
        }
    });
    
    return isValid;
}


document.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('input', function() {
        if (this.value) {
            this.classList.remove('error');
        }
    });
});


window.addEventListener('load', async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
            console.warn('API health check failed');
        }
    } catch (error) {
        console.warn('API not available:', error);
    }
});
