/* ============================================================
   MarketMeter — auth.js
   Works with plain HTML files — no server required.
   Uses localStorage to store and verify users.
   Passwords are hashed with a simple SHA-256 equivalent
   using the Web Crypto API (built into every modern browser).

   FOLDER: marketmeter/js/auth.js
   ============================================================ */

'use strict';

const DB_KEY      = 'mmUsers';    /* localStorage key for user list */
const SESSION_KEY = 'mmSession';  /* sessionStorage key for logged-in user */

/* ============================================================
   CRYPTO: SHA-256 hash using Web Crypto API
   Returns a hex string promise.
   ============================================================ */

async function sha256(message) {
  const msgBuffer  = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ============================================================
   DATABASE HELPERS (localStorage)
   ============================================================ */

function getUsers() {
  return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
}

function saveUsers(users) {
  localStorage.setItem(DB_KEY, JSON.stringify(users));
}

function findUserByEmail(email) {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

/* ============================================================
   SESSION HELPERS (sessionStorage — clears on tab close)
   ============================================================ */

function saveSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function getSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

/* ============================================================
   UI HELPERS
   ============================================================ */

function showFieldError(groupId, errorId, message) {
  const group = document.getElementById(groupId);
  const error = document.getElementById(errorId);
  if (group) { group.classList.remove('is-valid'); group.classList.add('is-invalid'); }
  if (error) error.textContent = message;
}

function clearFieldError(groupId, errorId) {
  const group = document.getElementById(groupId);
  const error = document.getElementById(errorId);
  if (group) { group.classList.remove('is-invalid'); group.classList.add('is-valid'); }
  if (error) error.textContent = '';
}

function showAlert(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (message) { el.textContent = message; el.style.display = 'block'; }
  else         { el.textContent = ''; el.style.display = 'none'; }
}

function setButtonLoading(btnId, loading, originalText) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled    = loading;
  btn.textContent = loading ? 'Please wait...' : originalText;
}

/* ============================================================
   VALIDATORS
   ============================================================ */

function isValidEmail(v)    { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isValidName(v)     { return v.trim().length >= 2; }
function isValidPassword(v) { return v.length >= 8; }

function getPasswordStrength(v) {
  if (!v || v.length < 8) return 'weak';
  const score = [/[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/].filter(r => r.test(v)).length;
  if (score <= 2) return 'weak';
  if (score === 3) return 'medium';
  return 'strong';
}

/* ============================================================
   TOGGLE PASSWORD VISIBILITY
   ============================================================ */

function initTogglePasswordButtons() {
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', function () {
      const input = document.getElementById(btn.getAttribute('data-target'));
      if (!input) return;
      input.type      = input.type === 'password' ? 'text' : 'password';
      btn.textContent = input.type === 'password' ? 'Show' : 'Hide';
    });
  });
}

/* ============================================================
   LOGIN FORM
   ============================================================ */

function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const emailInput    = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');

  emailInput.addEventListener('blur',    () => validateLoginEmail());
  passwordInput.addEventListener('blur', () => validateLoginPassword());
  [emailInput, passwordInput].forEach(el =>
    el.addEventListener('input', () => showAlert('loginGeneralError', ''))
  );

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!validateLoginEmail() | !validateLoginPassword()) return;

    const email    = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    setButtonLoading('loginBtn', true, 'Login');

    const user = findUserByEmail(email);
    if (!user) {
      showAlert('loginGeneralError', 'Invalid email or password.');
      setButtonLoading('loginBtn', false, 'Login');
      return;
    }

    const hashed = await sha256(password);
    if (hashed !== user.password) {
      showAlert('loginGeneralError', 'Invalid email or password.');
      setButtonLoading('loginBtn', false, 'Login');
      return;
    }

    /* Build a safe session object (no password) */
    saveSession({
      id:          user.id,
      fullName:    user.fullName,
      email:       user.email,
      submissions: user.submissions,
      memberSince: user.memberSince
    });

    /* Redirect to dashboard */
    window.location.href = 'dashboard.html';
  });
}

function validateLoginEmail() {
  const v = document.getElementById('loginEmail').value.trim();
  if (!v)               { showFieldError('group-login-email', 'error-login-email', 'Email address is required.'); return false; }
  if (!isValidEmail(v)) { showFieldError('group-login-email', 'error-login-email', 'Please enter a valid email address.'); return false; }
  clearFieldError('group-login-email', 'error-login-email');
  return true;
}

function validateLoginPassword() {
  if (!document.getElementById('loginPassword').value) {
    showFieldError('group-login-password', 'error-login-password', 'Password is required.');
    return false;
  }
  clearFieldError('group-login-password', 'error-login-password');
  return true;
}

/* ============================================================
   REGISTER FORM
   ============================================================ */

function initRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  const nameInput     = document.getElementById('regName');
  const emailInput    = document.getElementById('regEmail');
  const passwordInput = document.getElementById('regPassword');
  const confirmInput  = document.getElementById('regConfirmPassword');

  nameInput.addEventListener('blur',     () => validateRegName());
  emailInput.addEventListener('blur',    () => validateRegEmail());
  passwordInput.addEventListener('blur', () => validateRegPassword());
  confirmInput.addEventListener('blur',  () => validateRegConfirm());

  passwordInput.addEventListener('input', function () {
    updateStrengthMeter(this.value);
    if (confirmInput.value) validateRegConfirm();
  });
  confirmInput.addEventListener('input', function () {
    if (this.value) validateRegConfirm();
  });

  [nameInput, emailInput, passwordInput, confirmInput].forEach(el =>
    el.addEventListener('input', () => {
      showAlert('registerGeneralError', '');
      showAlert('registerSuccess', '');
    })
  );

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nameOk    = validateRegName();
    const emailOk   = validateRegEmail();
    const passOk    = validateRegPassword();
    const confirmOk = validateRegConfirm();
    if (!nameOk || !emailOk || !passOk || !confirmOk) return;

    const fullName = nameInput.value.trim();
    const email    = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    setButtonLoading('registerBtn', true, 'Create an Account');
    showAlert('registerGeneralError', '');
    showAlert('registerSuccess', '');

    /* Check for duplicate email */
    if (findUserByEmail(email)) {
      showAlert('registerGeneralError', 'This email is already registered.');
      setButtonLoading('registerBtn', false, 'Create an Account');
      return;
    }

    /* Hash password then save */
    const hashedPassword = await sha256(password);
    const newUser = {
      id:          Date.now().toString(),
      fullName,
      email,
      password:    hashedPassword,
      submissions: 0,
      memberSince: new Date().toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }),
      createdAt:   new Date().toISOString()
    };

    const users = getUsers();
    users.push(newUser);
    saveUsers(users);

    showAlert('registerSuccess', 'Account created! Redirecting to login...');

    setTimeout(() => { window.location.href = 'login.html'; }, 2000);
  });
}

function validateRegName() {
  const v = document.getElementById('regName').value.trim();
  if (!v)              { showFieldError('group-reg-name', 'error-reg-name', 'Full name is required.'); return false; }
  if (!isValidName(v)) { showFieldError('group-reg-name', 'error-reg-name', 'Name must be at least 2 characters.'); return false; }
  clearFieldError('group-reg-name', 'error-reg-name');
  return true;
}

function validateRegEmail() {
  const v = document.getElementById('regEmail').value.trim();
  if (!v)               { showFieldError('group-reg-email', 'error-reg-email', 'Email address is required.'); return false; }
  if (!isValidEmail(v)) { showFieldError('group-reg-email', 'error-reg-email', 'Please enter a valid email address.'); return false; }
  clearFieldError('group-reg-email', 'error-reg-email');
  return true;
}

function validateRegPassword() {
  const v = document.getElementById('regPassword').value;
  if (!v)                  { showFieldError('group-reg-password', 'error-reg-password', 'Password is required.'); return false; }
  if (!isValidPassword(v)) { showFieldError('group-reg-password', 'error-reg-password', 'Password must be at least 8 characters.'); return false; }
  clearFieldError('group-reg-password', 'error-reg-password');
  return true;
}

function validateRegConfirm() {
  const pass    = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirmPassword').value;
  if (!confirm)         { showFieldError('group-reg-confirm', 'error-reg-confirm', 'Please confirm your password.'); return false; }
  if (pass !== confirm) { showFieldError('group-reg-confirm', 'error-reg-confirm', 'Passwords do not match.'); return false; }
  clearFieldError('group-reg-confirm', 'error-reg-confirm');
  return true;
}

function updateStrengthMeter(value) {
  const fill    = document.getElementById('strengthFill');
  const label   = document.getElementById('strengthLabel');
  const wrapper = document.getElementById('passwordStrength');
  if (!fill || !label || !wrapper) return;
  if (!value) {
    wrapper.style.display = 'none';
    fill.className        = 'strength-fill';
    label.textContent     = '';
    return;
  }
  const s = getPasswordStrength(value);
  wrapper.style.display = 'flex';
  fill.className        = 'strength-fill strength-' + s;
  label.textContent     = 'Strength: ' + ({ weak: 'Weak', medium: 'Medium', strong: 'Strong' }[s]);
}

/* ============================================================
   INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  initTogglePasswordButtons();
  initLoginForm();
  initRegisterForm();
});