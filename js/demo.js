/**
 * CryptoLogin - Demo Interactive
 * 
 * Cette démo simule le flux d'authentification.
 * Elle appelle l'API CryptoLogin déployée sur votre VPS.
 */

// backend API URL 
const API_BASE_URL = 'http://api.docudeeper.com';  

// État de la session
let sessionId = null;
let userId = null;

// Éléments DOM
const secretInput = document.getElementById('demoSecret');
const registerBtn = document.getElementById('demoRegister');
const loginBtn = document.getElementById('demoLogin');
const logoutBtn = document.getElementById('demoLogout');
const statusEl = document.getElementById('demoStatus');
const resultEl = document.getElementById('demoResult');
const outputEl = document.getElementById('demoOutput');

// ================================================================
// UTILITAIRES
// ================================================================

function setStatus(message, type = 'info') {
    statusEl.textContent = message;
    statusEl.className = `demo__status demo__status--${type}`;
}

function showResult(data, isSuccess = true) {
    resultEl.style.display = 'block';
    outputEl.textContent = JSON.stringify(data, null, 2);
    outputEl.style.color = isSuccess ? 'var(--color-success)' : 'var(--color-error)';
}

function hideResult() {
    resultEl.style.display = 'none';
}

function getSecret() {
    const secret = secretInput.value.trim();
    if (secret.length < 32) {
        setStatus('Secret must be at least 32 characters.', 'warning');
        return null;
    }
    return secret;
}

function isLoggedIn() {
    return sessionId !== null;
}

function updateUI() {
    if (isLoggedIn()) {
        registerBtn.style.display = 'none';
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        setStatus('✅ Connected. Session active.', 'success');
    } else {
        registerBtn.style.display = 'inline-block';
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        setStatus('🚀 Ready to start', 'info');
    }
}

// ================================================================
// APPELS API
// ================================================================

async function apiCall(endpoint, method = 'POST', body = null, auth = false) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
    };

    if (auth && sessionId) {
        headers['Authorization'] = `Bearer ${sessionId}`;
    }

    const options = {
        method,
        headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        return { status: response.status, data };
    } catch (error) {
        console.error('API call error:', error);
        return { status: 0, data: { error: error.message } };
    }
}

// ================================================================
// ACTIONS
// ================================================================

// 1. REGISTER
registerBtn.addEventListener('click', async () => {
    const secret = getSecret();
    if (!secret) return;

    hideResult();
    setStatus('📝 Registering...', 'info');

    const result = await apiCall('/auth/register', 'POST', {
        master_secret: secret,
        user_data: {
            name: 'Demo User',
            source: 'cryptologin-demo'
        }
    });

    if (result.status === 200) {
        userId = result.data.data.user_id;
        setStatus('✅ User registered! Please login.', 'success');
        showResult({
            action: 'register',
            user_id: userId,
            message: 'User created successfully'
        }, true);
    } else {
        setStatus(`❌ Error: ${result.data.detail || 'Unknown error'}`, 'error');
        showResult(result.data, false);
    }
});

// 2. LOGIN
loginBtn.addEventListener('click', async () => {
    const secret = getSecret();
    if (!secret) return;

    hideResult();
    setStatus('🔑 Logging in...', 'info');

    // Step 1: Initiate login
    const initResult = await apiCall('/auth/login/init', 'POST', {
        master_secret: secret
    });

    if (initResult.status !== 200) {
        setStatus(`❌ Error: ${initResult.data.detail || 'Unknown error'}`, 'error');
        showResult(initResult.data, false);
        return;
    }

    const challenge = initResult.data.challenge;

    // Step 2: Verify login
    const verifyResult = await apiCall('/auth/login/verify', 'POST', {
        master_secret: secret,
        challenge_response: challenge
    });

    if (verifyResult.status === 200) {
        sessionId = verifyResult.data.session_id;
        userId = verifyResult.data.user_id;
        updateUI();
        showResult({
            action: 'login',
            session_id: sessionId,
            user_id: userId,
            expires_at: verifyResult.data.expires_at,
            message: 'Authentication successful'
        }, true);

        // Get user data
        const dataResult = await apiCall(`/user/data?master_secret=${secret}`, 'GET', null, true);
        if (dataResult.status === 200) {
            showResult({
                action: 'get_data',
                data: dataResult.data.data,
                message: 'Data retrieved successfully'
            }, true);
        }
    } else {
        setStatus(`❌ Error: ${verifyResult.data.detail || 'Unknown error'}`, 'error');
        showResult(verifyResult.data, false);
    }
});

// 3. LOGOUT
logoutBtn.addEventListener('click', async () => {
    if (!sessionId) {
        setStatus('No active session.', 'warning');
        return;
    }

    setStatus('👋 Logging out...', 'info');

    const result = await apiCall('/auth/logout', 'POST', null, true);

    if (result.status === 200) {
        sessionId = null;
        userId = null;
        updateUI();
        showResult({
            action: 'logout',
            message: 'Logout successful'
        }, true);
        setStatus('👋 Logged out. See you soon!', 'info');
    } else {
        setStatus(`❌ Error: ${result.data.detail || 'Unknown error'}`, 'error');
        showResult(result.data, false);
    }
});

// ================================================================
// INIT
// ================================================================

updateUI();

console.log('🔐 CryptoLogin Demo loaded');
console.log(`API Base URL: ${API_BASE_URL}`);