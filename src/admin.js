/* src/admin.js */
import { getActiveBrandingLink, saveBrandingLink } from './config.js';

const VALID_USER = "fabbeytheone";
const VALID_PASS = "me@ndmyself11";

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const linkInput = document.getElementById('link-input');
const saveLinkBtn = document.getElementById('save-link-btn');
const notification = document.getElementById('notification');
const codeSnippet = document.getElementById('code-snippet');
const copyBtn = document.getElementById('copy-btn');

/**
 * Check session on load
 */
function checkSession() {
    const isAuth = sessionStorage.getItem('admin_authenticated');
    if (isAuth === 'true') {
        showDashboard();
    }
}

/**
 * Handle Login
 */
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    if (user === VALID_USER && pass === VALID_PASS) {
        sessionStorage.setItem('admin_authenticated', 'true');
        showDashboard();
    } else {
        loginError.classList.remove('hidden');
        // Flash red effect
        loginScreen.style.borderColor = "#ff0044";
        setTimeout(() => loginScreen.style.borderColor = "", 500);
    }
});

/**
 * Show Dashboard
 */
function showDashboard() {
    loginScreen.classList.add('hidden');
    dashboard.classList.remove('hidden');
    
    // Fill current link
    const currentLink = getActiveBrandingLink();
    linkInput.value = currentLink;
    updateCodeSnippet(currentLink);
}

/**
 * Update HUD Link
 */
saveLinkBtn.addEventListener('click', () => {
    const newLink = linkInput.value.trim();
    if (!newLink) return;

    saveBrandingLink(newLink);
    updateCodeSnippet(newLink);
    showNotification("HUD CONFIGURATION UPDATED");
});

/**
 * Update the developer code snippet
 */
function updateCodeSnippet(link) {
    codeSnippet.textContent = `defaultLink: "${link}"`;
}

/**
 * Copy to Clipboard
 */
copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(codeSnippet.textContent);
    showNotification("CODE COPIED TO CLIPBOARD");
});

/**
 * Handle Logout
 */
logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('admin_authenticated');
    location.reload();
});

/**
 * Toast Notification
 */
function showNotification(msg) {
    notification.textContent = msg;
    notification.classList.remove('hidden');
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// Initialize
checkSession();
