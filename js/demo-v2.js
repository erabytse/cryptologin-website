/**
 * CryptoLogin Demo - V2 (Real Flow)
 * The master secret NEVER leaves the browser.
 * 
 * Flow:
 * 1. Client derives user_id using Web Crypto API (PBKDF2-SHA512)
 * 2. Client sends user_id to server
 * 3. Server generates encrypted challenge (Flash512)
 * 4. Client sends encrypted challenge back to server
 * 5. Server decrypts and verifies challenge (Flash512)
 */

// ================================================================
// CONFIGURATION
// ================================================================

const isLocal_v2 = window.location.hostname === '127.0.0.1' || 
                window.location.hostname === 'localhost' ||
                window.location.hostname === 'localhost:8080';


const API_BASE_URL = isLocal_v2 
    ? 'http://localhost:8000/api/v1'
    : 'https://api.docudeeper.com/api/v1';

console.log('🔐 CryptoLogin Demo V2 loaded');
console.log(`🌍 Environment: ${isLocal_v2 ? 'LOCAL' : 'PRODUCTION'}`);
console.log(`🌐 API Base URL: ${API_BASE_URL}`);

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
        setStatus('🚀 Ready to start (V2 - Real Flow)', 'info');
    }
}

// ================================================================
// API CALLS
// ================================================================

async function apiCall(endpoint, method = 'POST', body = null, auth = false) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`📡 API Call: ${method} ${url}`);
    
    const headers = { 'Content-Type': 'application/json' };
    if (auth && sessionId) {
        headers['Authorization'] = `Bearer ${sessionId}`;
        console.log(`🔑 Adding Authorization header: Bearer ${sessionId.substring(0, 16)}...`);
    }
    
    const options = { method, headers };
    if (body) {
        options.body = JSON.stringify(body);
        console.log('📦 Body:', body);
    }
    
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        console.log(`📨 Response (${response.status}):`, data);
        return { status: response.status, data };
    } catch (error) {
        console.error('❌ API call error:', error);
        return { status: 0, data: { error: error.message } };
    }
}

// ================================================================
// CLIENT-SIDE CRYPTO (Web Crypto API)
// ================================================================

/**
 * Derive user_id from master_secret using PBKDF2-SHA512
 * This is the same derivation used by the server.
 */
async function deriveUserId(masterSecret) {
    console.log('🔑 Deriving user_id from master_secret...');
    
    const encoder = new TextEncoder();
    const secretData = encoder.encode(masterSecret);
    const salt = encoder.encode('cryptologin-v2-salt');
    
    // Import the key for PBKDF2
    const key = await crypto.subtle.importKey(
        'raw',
        secretData,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );
    
    // Derive 256 bits (32 bytes)
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-512'
        },
        key,
        256
    );
    
    // Convert to hex string (64 characters)
    const hashArray = Array.from(new Uint8Array(derivedBits));
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    console.log(`✅ User ID derived: ${hex.substring(0, 32)}...`);
    return hex;
}

// ================================================================
// REGISTER (V2)
// ================================================================

registerBtn.addEventListener('click', async () => {
    console.log('🖱️ Register button clicked (V2)');
    
    const secret = getSecret();
    if (!secret) return;
    
    setStatus('📝 Deriving user_id...', 'info');
    try {
        // Step 1: Derive user_id (CLIENT-SIDE)
        userId = await deriveUserId(secret);
        
        // Step 2: Send user_id to server (master_secret NEVER leaves client)
        setStatus('📝 Registering user...', 'info');
        const result = await apiCall('/auth/register_v2', 'POST', {
            user_id: userId,
            user_data: {
                name: 'Demo User',
                source: 'cryptologin-demo-v2'
            }
        });
        
        if (result.status === 200) {
            setStatus('✅ User registered! Please login.', 'success');
            showResult({
                action: 'register_v2',
                user_id: userId,
                message: 'User created successfully'
            }, true);
        } else {
            const errorMsg = result.data?.detail || result.data?.error || 'Unknown error';
            setStatus(`❌ Error: ${errorMsg}`, 'error');
            showResult(result.data, false);
        }
    } catch (error) {
        console.error('❌ Registration error:', error);
        setStatus(`❌ Error: ${error.message}`, 'error');
        showResult({ error: error.message }, false);
    }
});

// ================================================================
// LOGIN (V2) - REAL FLOW
// ================================================================

loginBtn.addEventListener('click', async () => {
    console.log('🖱️ Login button clicked (V2)');
    
    const secret = getSecret();
    if (!secret) return;
    
    setStatus('🔑 Logging in...', 'info');
    try {
        // Step 1: Derive user_id (CLIENT-SIDE) if not already done
        if (!userId) {
            userId = await deriveUserId(secret);
        }
        
        // Step 2: Get encrypted challenge from server
        const initResult = await apiCall('/auth/login/init_v2', 'POST', {
            user_id: userId
        });
        
        if (initResult.status !== 200) {
            const errorMsg = initResult.data?.detail || initResult.data?.error || 'Unknown error';
            setStatus(`❌ Error: ${errorMsg}`, 'error');
            showResult(initResult.data, false);
            return;
        }
        
        // Step 3: Get the encrypted challenge
        const encryptedChallenge = initResult.data.challenge;
        console.log(`🔑 Encrypted challenge received: ${encryptedChallenge.substring(0, 32)}...`);
        
        // Step 4: Send the encrypted challenge back to the server
        // The client DOES NOT decrypt it. The server handles decryption.
        setStatus('🔑 Verifying challenge with server...', 'info');
        const verifyResult = await apiCall('/auth/login/verify_v2', 'POST', {
            user_id: userId,
            challenge_response: encryptedChallenge  // Send back the encrypted token
        });
        
        if (verifyResult.status === 200) {
            sessionId = verifyResult.data.session_id;
            userId = verifyResult.data.user_id;
            console.log(`✅ Session ID set: ${sessionId.substring(0, 16)}...`);
            updateUI();
            showResult({
                action: 'login_v2',
                session_id: sessionId,
                user_id: userId,
                expires_at: verifyResult.data.expires_at,
                message: 'Authentication successful (Real Flow)'
            }, true);
            console.log('✅ Authentication successful!');
        } else {
            let errorMsg = 'Unknown error';
            if (verifyResult.data?.detail) {
                if (Array.isArray(verifyResult.data.detail)) {
                    errorMsg = verifyResult.data.detail.map(d => d.msg).join(', ');
                } else {
                    errorMsg = verifyResult.data.detail;
                }
            } else if (verifyResult.data?.error) {
                errorMsg = verifyResult.data.error;
            }
            setStatus(`❌ Error: ${errorMsg}`, 'error');
            showResult(verifyResult.data, false);
        }
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

    console.log(`🔑 Session ID being sent: ${sessionId}`);

    const result = await apiCall('/auth/logout', 'POST', null, true);
    
    if (result.status === 200) {
        sessionId = null;
        userId = null;
        updateUI();
        showResult({
            action: 'logout',
            message: 'Logout successful'
        }, true);
        setStatus('👋 Logged out.', 'info');
    } else {
        const errorMsg = result.data?.detail || result.data?.error || 'Unknown error';
        setStatus(`❌ Error: ${errorMsg}`, 'error');
        showResult(result.data, false);
    }
});

// ================================================================
// CHAR COUNTER
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
// const charCounter = document.getElementById('charCounter2');

// if (secretInput && charCounter) {
//     function updateCharCounter() {
//         const length = secretInput.value.length;
//         const minLength = 32;
//         charCounter.textContent = `${length}/${minLength}`;
//         charCounter.className = 'char-counter';
//         if (length === 0) {
//             // neutre
//         } else if (length >= minLength) {
//             charCounter.classList.add('valid');
//         } else if (length >= minLength * 0.7) {
//             charCounter.classList.add('warning');
//         } else {
//             charCounter.classList.add('invalid');
//         }
//     }
//     secretInput.addEventListener('input', updateCharCounter);
//     updateCharCounter();
// }



// if (secretInput2 && charCounter) {
//     // Fonction de mise à jour du compteur
//     function updateCharCounter() {
//         const length = secretInput2.value.length;
//         const minLength = 32;
        
//         // Mettre à jour le texte
//         charCounter2.textContent = `${length}/${minLength}`;
        
//         // Mettre à jour les classes
//         charCounter2.className = 'char-counter';
        
//         if (length === 0) {
//             // Aucun caractère : neutre
//         } else if (length >= minLength) {
//             charCounter2.classList.add('valid');
//         } else if (length >= minLength * 0.7) { // 70% de l'objectif
//             charCounter2.classList.add('warning');
//         } else {
//             charCounter2.classList.add('invalid');
//         }
//     }
    
//     // Écouter les événements
//     secretInput2.addEventListener('input', updateCharCounter);
//     secretInput2.addEventListener('focus', updateCharCounter);
//     secretInput2.addEventListener('blur', updateCharCounter);
    
    // Initialiser
//     updateCharCounter();
// }

// ================================================================
// INIT
// ================================================================

console.log('✅ The master_secret NEVER leaves the browser.');
console.log('🔐 Crypto engine: Web Crypto API (client) + Flash512 (server)');
console.log('✅ Ready to start.');

updateUI();