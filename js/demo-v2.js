/**
 * CryptoLogin Demo - V2 (Real Zero-Knowledge Flow with SDK)
 * Uses cryptologin-client npm package
 */

// Import SDK from CDN
import { createClient, deriveUserId, computeHmac } from 'https://cdn.jsdelivr.net/npm/cryptologin-client@1.2.3/+esm';

// ================================================================
// CONFIGURATION
// ================================================================
const isLocal = window.location.hostname === '127.0.0.1' || 
                window.location.hostname === 'localhost';

const API_BASE_URL = isLocal 
    ? 'http://localhost:8000/api/v1'
    : 'https://api.docudeeper.com/api/v1';

console.log('🔐 CryptoLogin Demo V2 loaded (with SDK)');
console.log(`🌍 Environment: ${isLocal ? 'LOCAL' : 'PRODUCTION'}`);
console.log(`🌐 API Base URL: ${API_BASE_URL}`);

// Initialize SDK client
const client = createClient({
    baseURL: API_BASE_URL,
    timeout: 30000
});

// ================================================================
// STATE
// ================================================================
let sessionId = null;
let userId = null;
let currentSecret = null;

// ================================================================
// DOM ELEMENTS
// ================================================================
const secretInput = document.getElementById('demoSecret2');
const registerBtn = document.getElementById('demoRegister2');
const loginBtn = document.getElementById('demoLogin2');
const logoutBtn = document.getElementById('demoLogout2');
const statusEl = document.getElementById('demoStatus2');
const resultEl = document.getElementById('demoResult2');
const outputEl = document.getElementById('demoOutput2');

// ================================================================
// UTILITIES
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

function updateUI() {
    if (sessionId) {
        registerBtn.style.display = 'none';
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        setStatus('✅ Connected. Session active.', 'success');
    } else {
        registerBtn.style.display = 'inline-block';
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        setStatus('🚀 Ready to start (V2 - Real Zero-Knowledge Flow)', 'info');
    }
}

// ================================================================
// REGISTER (V2) - Using SDK
// ================================================================
registerBtn.addEventListener('click', async () => {
    console.log('🖱️ Register button clicked (V2 with SDK)');
    const secret = getSecret();
    if (!secret) return;

    setStatus('📝 Registering with SDK...', 'info');

    try {
        // SDK handles everything: derive user_id, call API
        userId = await client.register(secret, {
            name: 'Demo User',
            source: 'cryptologin-demo-v2-sdk'
        });

        setStatus('✅ User registered! Please login.', 'success');
        showResult({
            action: 'register_v2',
            user_id: userId,
            message: 'User created successfully (SDK)'
        }, true);
    } catch (error) {
        console.error('❌ Registration error:', error);
        setStatus(`❌ Error: ${error.message}`, 'error');
        showResult({ error: error.message }, false);
    }
});

// ================================================================
// LOGIN (V2) - Using SDK with HMAC
// ================================================================
loginBtn.addEventListener('click', async () => {
    console.log('🖱️ Login button clicked (V2 with SDK)');
    const secret = getSecret();
    if (!secret) return;

    setStatus('🔑 Logging in with SDK...', 'info');

    try {
        // SDK handles everything: derive user_id, get challenge, compute HMAC, verify
        const session = await client.login(secret);

        sessionId = session.sessionId;
        userId = session.userId;
        
        console.log(`✅ Session ID set: ${sessionId.substring(0, 16)}...`);
        updateUI();
        
        showResult({
            action: 'login_v2',
            session_id: sessionId,
            user_id: userId,
            expires_at: session.expiresAt,
            message: 'Authentication successful (SDK + HMAC)'
        }, true);
        
        console.log('✅ Authentication successful!');
    } catch (error) {
        console.error('❌ Login error:', error);
        setStatus(`❌ Error: ${error.message}`, 'error');
        showResult({ error: error.message }, false);
    }
});

// ================================================================
// LOGOUT
// ================================================================
logoutBtn.addEventListener('click', async () => {
    console.log('🖱️ Logout button clicked');
    if (!sessionId) {
        setStatus('No active session.', 'warning');
        return;
    }

    setStatus('👋 Logging out...', 'info');

    try {
        await client.logout();
        sessionId = null;
        userId = null;
        updateUI();
        showResult({
            action: 'logout',
            message: 'Logout successful'
        }, true);
        setStatus('👋 Logged out.', 'info');
    } catch (error) {
        console.error('❌ Logout error:', error);
        setStatus(`❌ Error: ${error.message}`, 'error');
    }
});

// ================================================================
// COMPTEUR DE CARACTÈRES
// ================================================================

const secretInputLanding2 = document.querySelector('#demoSecret2');
const charCounterLanding2 = document.getElementById('charCounter2');

if (secretInputLanding2 && charCounterLanding2) {
    function updateCharCounter2() {
        const length = secretInputLanding2.value.length;
        const minLength = 32;
        
        charCounterLanding2.textContent = `${length}/${minLength}`;
        charCounterLanding2.className = 'char-counter2';
        
        if (length === 0) {
            // neutre
        } else if (length >= minLength) {
            charCounterLanding2.classList.add('valid');
        } else if (length >= minLength * 0.7) {
            charCounterLanding2.classList.add('warning');
        } else {
            charCounterLanding2.classList.add('invalid');
        }
    }
    
    secretInputLanding2.addEventListener('input', updateCharCounter2);
    updateCharCounter2();
}

// ================================================================
// INIT
// ================================================================
updateUI();
console.log('✅ Demo V2 ready (with SDK). Waiting for user interaction.');