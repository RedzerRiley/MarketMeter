/* ============================================================
   MarketMeter — auth.js
   Client-side form validation for login.html and register.html.

   BACKEND DEVELOPER: Search for "BACKEND HOOK" comments to find
   exactly where to plug in your local database logic.
   ============================================================ */

'use strict';

/* ============================================================
   UTILITY: Field-level error helpers
   ============================================================ */

/**
 * Mark a field as invalid and display an error message.
 * @param {string} groupId  - The id of the .form-group wrapper
 * @param {string} errorId  - The id of the .form-error <span>
 * @param {string} message  - The error message to display
 */
function showFieldError(groupId, errorId, message) {
  const group = document.getElementById(groupId);
  const error = document.getElementById(errorId);
  if (group) {
    group.classList.remove('is-valid');
    group.classList.add('is-invalid');
  }
  if (error) error.textContent = message;
}

/**
 * Mark a field as valid and clear its error message.
 * @param {string} groupId  - The id of the .form-group wrapper
 * @param {string} errorId  - The id of the .form-error <span>
 */
function clearFieldError(groupId, errorId) {
  const group = document.getElementById(groupId);
  const error = document.getElementById(errorId);
  if (group) {
    group.classList.remove('is-invalid');
    group.classList.add('is-valid');
  }
  if (error) error.textContent = '';
}

/**
 * Reset all validation states on a field.
 * @param {string} groupId
 * @param {string} errorId
 */
function resetField(groupId, errorId) {
  const group = document.getElementById(groupId);
  const error = document.getElementById(errorId);
  if (group) {
    group.classList.remove('is-valid', 'is-invalid');
  }
  if (error) error.textContent = '';
}

/**
 * Show or hide a general alert banner.
 * @param {string} elementId - id of the .form-alert element
 * @param {string} message   - the message to show (pass '' to hide)
 */
function showAlert(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (message) {
    el.textContent = message;
    el.style.display = 'block';
  } else {
    el.textContent = '';
    el.style.display = 'none';
  }
}

/* ============================================================
   UTILITY: Individual validators
   ============================================================ */

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidName(value) {
  return value.trim().length >= 2;
}

function isValidPassword(value) {
  return value.length >= 8;
}

function getPasswordStrength(value) {
  if (value.length === 0) return null;
  const hasUpper   = /[A-Z]/.test(value);
  const hasLower   = /[a-z]/.test(value);
  const hasDigit   = /\d/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);
  const score      = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;

  if (value.length < 8)    return 'weak';
  if (score <= 2)          return 'weak';
  if (score === 3)         return 'medium';
  return 'strong';
}

/* ============================================================
   UTILITY: Toggle password visibility
   ============================================================ */

function initTogglePasswordButtons() {
  document.querySelectorAll('.toggle-password').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.getAttribute('data-target');
      var input    = document.getElementById(targetId);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = 'Hide';
      } else {
        input.type = 'password';
        btn.textContent = 'Show';
      }
    });
  });
}

/* ============================================================
   LOGIN FORM
   ============================================================ */

function initLoginForm() {
  var form = document.getElementById('loginForm');
  if (!form) return;

  var emailInput    = document.getElementById('loginEmail');
  var passwordInput = document.getElementById('loginPassword');

  /* -- Real-time validation -- */

  emailInput.addEventListener('blur', function () {
    validateLoginEmail();
  });

  passwordInput.addEventListener('blur', function () {
    validateLoginPassword();
  });

  /* -- Clear general error on typing -- */

  [emailInput, passwordInput].forEach(function (input) {
    input.addEventListener('input', function () {
      showAlert('loginGeneralError', '');
    });
  });

  /* -- Submit handler -- */

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var emailOk    = validateLoginEmail();
    var passwordOk = validateLoginPassword();

    if (!emailOk || !passwordOk) return;

    var email    = emailInput.value.trim();
    var password = passwordInput.value;

    /* --------------------------------------------------------
       BACKEND HOOK — Login authentication
       --------------------------------------------------------
       Replace the block below with your local database lookup.

       Expected behaviour:
         - Look up `email` in your user store.
         - Compare `password` against the stored (hashed) password.
         - On success: redirect to dashboard or update UI.
         - On failure: call showAlert('loginGeneralError', 'Invalid email or password.');

       Example skeleton:
         var user = DB.findUserByEmail(email);
         if (!user || user.password !== hashPassword(password)) {
           showAlert('loginGeneralError', 'Invalid email or password.');
           return;
         }
         window.location.href = 'dashboard.html';
       -------------------------------------------------------- */

    console.log('[MarketMeter] Login submitted:', { email: email });
    // Remove the console.log above once you connect the backend.
    showAlert('loginGeneralError', 'Backend not connected yet. See auth.js for integration notes.');
  });
}

function validateLoginEmail() {
  var input = document.getElementById('loginEmail');
  var value = input.value.trim();
  if (!value) {
    showFieldError('group-login-email', 'error-login-email', 'Email address is required.');
    return false;
  }
  if (!isValidEmail(value)) {
    showFieldError('group-login-email', 'error-login-email', 'Please enter a valid email address.');
    return false;
  }
  clearFieldError('group-login-email', 'error-login-email');
  return true;
}

function validateLoginPassword() {
  var input = document.getElementById('loginPassword');
  if (!input.value) {
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
  var form = document.getElementById('registerForm');
  if (!form) return;

  var nameInput     = document.getElementById('regName');
  var emailInput    = document.getElementById('regEmail');
  var passwordInput = document.getElementById('regPassword');
  var confirmInput  = document.getElementById('regConfirmPassword');

  /* -- Real-time validation on blur -- */

  nameInput.addEventListener('blur',     function () { validateRegName(); });
  emailInput.addEventListener('blur',    function () { validateRegEmail(); });
  passwordInput.addEventListener('blur', function () { validateRegPassword(); });
  confirmInput.addEventListener('blur',  function () { validateRegConfirm(); });

  /* -- Live password strength meter -- */

  passwordInput.addEventListener('input', function () {
    updateStrengthMeter(passwordInput.value);
    // Re-validate confirm if user has already typed it
    if (confirmInput.value) validateRegConfirm();
  });

  /* -- Live confirm match feedback -- */

  confirmInput.addEventListener('input', function () {
    if (confirmInput.value) validateRegConfirm();
  });

  /* -- Clear general alerts on typing -- */

  [nameInput, emailInput, passwordInput, confirmInput].forEach(function (input) {
    input.addEventListener('input', function () {
      showAlert('registerGeneralError', '');
      showAlert('registerSuccess', '');
    });
  });

  /* -- Submit handler -- */

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var nameOk    = validateRegName();
    var emailOk   = validateRegEmail();
    var passOk    = validateRegPassword();
    var confirmOk = validateRegConfirm();

    if (!nameOk || !emailOk || !passOk || !confirmOk) return;

    var fullName = nameInput.value.trim();
    var email    = emailInput.value.trim();
    var password = passwordInput.value;

    /* --------------------------------------------------------
       BACKEND HOOK — User registration
       --------------------------------------------------------
       Replace the block below with your local database insert.

       Expected behaviour:
         - Check if `email` already exists in your user store.
         - If it does: showAlert('registerGeneralError', 'This email is already registered.');
         - If it doesn't:
             1. Hash the password (never store plaintext).
             2. Insert { fullName, email, hashedPassword, createdAt } into your DB.
             3. Show success and redirect.

       Example skeleton:
         if (DB.findUserByEmail(email)) {
           showAlert('registerGeneralError', 'This email is already registered.');
           return;
         }
         DB.createUser({ fullName, email, password: hashPassword(password) });
         showAlert('registerSuccess', 'Account created! Redirecting to login...');
         setTimeout(function() { window.location.href = 'login.html'; }, 2000);
       -------------------------------------------------------- */

    console.log('[MarketMeter] Register submitted:', { fullName: fullName, email: email });
    // Remove the console.log above once you connect the backend.
    showAlert('registerSuccess', 'Backend not connected yet. See auth.js for integration notes.');
  });
}

function validateRegName() {
  var input = document.getElementById('regName');
  var value = input.value.trim();
  if (!value) {
    showFieldError('group-reg-name', 'error-reg-name', 'Full name is required.');
    return false;
  }
  if (!isValidName(value)) {
    showFieldError('group-reg-name', 'error-reg-name', 'Name must be at least 2 characters.');
    return false;
  }
  clearFieldError('group-reg-name', 'error-reg-name');
  return true;
}

function validateRegEmail() {
  var input = document.getElementById('regEmail');
  var value = input.value.trim();
  if (!value) {
    showFieldError('group-reg-email', 'error-reg-email', 'Email address is required.');
    return false;
  }
  if (!isValidEmail(value)) {
    showFieldError('group-reg-email', 'error-reg-email', 'Please enter a valid email address.');
    return false;
  }
  clearFieldError('group-reg-email', 'error-reg-email');
  return true;
}

function validateRegPassword() {
  var input = document.getElementById('regPassword');
  var value = input.value;
  if (!value) {
    showFieldError('group-reg-password', 'error-reg-password', 'Password is required.');
    return false;
  }
  if (!isValidPassword(value)) {
    showFieldError('group-reg-password', 'error-reg-password', 'Password must be at least 8 characters.');
    return false;
  }
  clearFieldError('group-reg-password', 'error-reg-password');
  return true;
}

function validateRegConfirm() {
  var password = document.getElementById('regPassword').value;
  var confirm  = document.getElementById('regConfirmPassword').value;
  if (!confirm) {
    showFieldError('group-reg-confirm', 'error-reg-confirm', 'Please confirm your password.');
    return false;
  }
  if (password !== confirm) {
    showFieldError('group-reg-confirm', 'error-reg-confirm', 'Passwords do not match.');
    return false;
  }
  clearFieldError('group-reg-confirm', 'error-reg-confirm');
  return true;
}

function updateStrengthMeter(value) {
  var fill    = document.getElementById('strengthFill');
  var label   = document.getElementById('strengthLabel');
  var wrapper = document.getElementById('passwordStrength');
  if (!fill || !label || !wrapper) return;

  if (!value) {
    wrapper.style.display = 'none';
    fill.className = 'strength-fill';
    label.textContent = '';
    return;
  }

  wrapper.style.display = 'flex';
  var strength = getPasswordStrength(value);

  fill.className = 'strength-fill strength-' + strength;

  var labels = { weak: 'Weak', medium: 'Medium', strong: 'Strong' };
  label.textContent = 'Strength: ' + (labels[strength] || '');
}

/* ============================================================
   INIT — runs on every page that includes auth.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  initTogglePasswordButtons();
  initLoginForm();
  initRegisterForm();
});