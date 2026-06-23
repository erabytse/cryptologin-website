/**
 * CryptoLogin - Demo Interactive
 * Version pour GitHub Pages
 */

// ================================================================
// CONFIGURATION - À ADAPTER SELON L'ENVIRONNEMENT
// ================================================================

// Détection automatique de l'environnement
const isLocal = window.location.hostname === '127.0.0.1' || 
                window.location.hostname === 'localhost';

// URL de l'API selon l'environnement
const API_BASE_URL = isLocal 
    ? 'http://localhost:8000/api/v1'  // Développement local
    : 'http://api.docudeeper.com/api/v1';  // Production

console.log('🔐 CryptoLogin Demo loaded');
console.log(`🌍 Environment: ${isLocal ? 'LOCAL' : 'PRODUCTION'}`);
console.log(`🌐 API Base URL: ${API_BASE_URL}`);

// ================================================================
// ÉTAT DE LA SESSION
// ================================================================

let sessionId = null;
let userId = null;
let currentSecret = null;

// ================================================================
// ÉLÉMENTS DOM
// ================================================================

const secretInput = document.getElementById('demoSecret');
const registerBtn = document.getElementById('demoRegister');
const loginBtn = document.getElementById('demoLogin');
const logoutBtn = document.getElementById('demoLogout');
const statusEl = document.getElementById('demoStatus');
const resultEl = document.getElementById('demoResult');
const outputEl = document.getElementById('demoOutput');

console.log('✅ DOM elements found:', {
    secretInput: !!secretInput,
    registerBtn: !!registerBtn,
    loginBtn: !!loginBtn,
    logoutBtn: !!logoutBtn
});

// ================================================================
// UTILITAIRES
// ================================================================

function setStatus(message, type = 'info') {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `demo__status demo__status--${type}`;
    console.log(`[Status] ${type.toUpperCase()}: ${message}`);
}

function showResult(data, isSuccess = true) {
    if (!resultEl || !outputEl) return;
    resultEl.style.display = 'block';
    try {
        outputEl.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    } catch (e) {
        outputEl.textContent = String(data);
    }
    outputEl.style.color = isSuccess ? '#4CAF50' : '#FF5252';
}

function hideResult() {
    if (!resultEl) return;
    resultEl.style.display = 'none';
}

function getSecret() {
    if (!secretInput) return null;
    const secret = secretInput.value.trim();
    if (secret.length < 32) {
        setStatus('Secret must be at least 32 characters.', 'warning');
        return null;
    }
    currentSecret = secret;
    return secret;
}

function isLoggedIn() {
    return sessionId !== null;
}

function updateUI() {
    if (isLoggedIn()) {
        if (registerBtn) registerBtn.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        setStatus('✅ Connected. Session active.', 'success');
    } else {
        if (registerBtn) registerBtn.style.display = 'inline-block';
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        setStatus('🚀 Ready to start', 'info');
    }
}

// ================================================================
// APPELS API
// ================================================================

async function apiCall(endpoint, method = 'POST', body = null, auth = false) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`📡 API Call: ${method} ${url}`);
    
    const headers = {
        'Content-Type': 'application/json',
    };

    if (auth && sessionId) {
        headers['Authorization'] = `Bearer ${sessionId}`;
        console.log(`🔑 Using session: ${sessionId}`);
    }

    const options = {
        method,
        headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
        console.log(`📦 Body:`, body);
    }

    try {
        const response = await fetch(url, options);
        console.log(`📨 Response status: ${response.status}`);
        const data = await response.json();
        console.log(`📨 Response data:`, data);
        return { status: response.status, data };
    } catch (error) {
        console.error('❌ API call error:', error);
        return { status: 0, data: { error: error.message } };
    }
}

// ================================================================
// ACTIONS
// ================================================================

// 1. REGISTER
if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
        console.log('🖱️ Register button clicked');
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
            userId = result.data.data?.user_id;
            setStatus('✅ User registered! Please login.', 'success');
            showResult({
                action: 'register',
                user_id: userId,
                message: 'User created successfully'
            }, true);
            console.log(`✅ User registered: ${userId}`);
        } else {
            setStatus(`❌ Error: ${result.data?.detail || 'Unknown error'}`, 'error');
            showResult(result.data, false);
            console.error('❌ Register failed:', result);
        }
    });
}

// 2. LOGIN
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        console.log('🖱️ Login button clicked');
        const secret = getSecret();
        if (!secret) return;

        hideResult();
        setStatus('🔑 Logging in...', 'info');

        const initResult = await apiCall('/auth/login/init', 'POST', {
            master_secret: secret
        });

        if (initResult.status !== 200) {
            setStatus(`❌ Error: ${initResult.data?.detail || 'Unknown error'}`, 'error');
            showResult(initResult.data, false);
            console.error('❌ Login init failed:', initResult);
            return;
        }

        const challenge = initResult.data.challenge;
        console.log(`🔑 Challenge received: ${challenge.substring(0, 32)}...`);

        const verifyResult = await apiCall('/auth/login/verify', 'POST', {
            master_secret: secret,
            challenge_response: challenge
        });

        if (verifyResult.status === 200) {
            sessionId = verifyResult.data.session_id;
            userId = verifyResult.data.user_id;
            currentSecret = secret;
            updateUI();
            showResult({
                action: 'login',
                session_id: sessionId,
                user_id: userId,
                expires_at: verifyResult.data.expires_at,
                message: 'Authentication successful'
            }, true);
            console.log(`✅ Login successful: ${userId}`);

            const dataResult = await apiCall(`/user/data?master_secret=${secret}`, 'GET', null, true);
            if (dataResult.status === 200) {
                showResult({
                    action: 'get_data',
                    data: dataResult.data.data,
                    message: 'Data retrieved successfully'
                }, true);
                console.log('✅ User data retrieved:', dataResult.data.data);
            }
        } else {
            setStatus(`❌ Error: ${verifyResult.data?.detail || 'Unknown error'}`, 'error');
            showResult(verifyResult.data, false);
            console.error('❌ Login verify failed:', verifyResult);
        }
    });
}

// 3. LOGOUT
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        console.log('🖱️ Logout button clicked');
        if (!sessionId) {
            setStatus('No active session.', 'warning');
            return;
        }

        setStatus('👋 Logging out...', 'info');

        const result = await apiCall('/auth/logout', 'POST', null, true);

        if (result.status === 200) {
            sessionId = null;
            userId = null;
            currentSecret = null;
            updateUI();
            showResult({
                action: 'logout',
                message: 'Logout successful'
            }, true);
            console.log('✅ Logout successful');
            setStatus('👋 Logged out. See you soon!', 'info');
        } else {
            setStatus(`❌ Error: ${result.data?.detail || 'Unknown error'}`, 'error');
            showResult(result.data, false);
            console.error('❌ Logout failed:', result);
        }
    });
}

// ================================================================
// INIT
// ================================================================

updateUI();
console.log('✅ Demo ready. Waiting for user interaction.');