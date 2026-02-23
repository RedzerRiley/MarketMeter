/* ============================================================
   MarketMeter — app.js
   Shared JS for authenticated pages (dashboard, submit-price).
   Guards pages — redirects to login if no session exists.
   Reads session saved by auth.js after login.

   FOLDER: marketmeter/js/app.js
   ============================================================ */

'use strict';

const SESSION_KEY = 'mmSession';
const DB_KEY      = 'mmUsers';

/* ============================================================
   SESSION GUARD
   Call at top of every authenticated page.
   Returns the user object or redirects to login.
   ============================================================ */

function requireAuth() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) {
    window.location.href = 'login.html';
    return null;
  }
  return JSON.parse(raw);
}

function getSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

/* ============================================================
   SIDEBAR PROFILE POPULATION
   ============================================================ */

function initProfile(user) {
  function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function getInitials(name) {
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }

  setEl('avatarInitials',  getInitials(user.fullName));
  setEl('profileName',     user.fullName);
  setEl('profileEmail',    user.email);
  setEl('statSubmissions', user.submissions !== undefined ? user.submissions : 0);
  setEl('statMemberSince', user.memberSince || '—');
  setEl('welcomeName',     user.fullName.split(' ')[0]);
}

/* ============================================================
   LOGOUT — clears session, redirects to login
   ============================================================ */

function initLogout() {
  document.querySelectorAll('.sidebar-logout').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      sessionStorage.removeItem(SESSION_KEY);
      window.location.href = 'login.html';
    });
  });
}

/* ============================================================
   SUBMISSION COUNTER
   Increments count in localStorage and updates the session.
   Called from submit-price.html after a successful submit.
   ============================================================ */

function incrementSubmissions() {
  const user = getSession();
  if (!user) return;

  /* Update the user record in localStorage */
  const users  = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
  const record = users.find(u => u.id === user.id);
  if (record) {
    record.submissions = (record.submissions || 0) + 1;
    localStorage.setItem(DB_KEY, JSON.stringify(users));

    /* Sync session */
    user.submissions = record.submissions;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));

    /* Update sidebar counter live */
    const el = document.getElementById('statSubmissions');
    if (el) el.textContent = record.submissions;
  }
}

/* ============================================================
   SIDEBAR TOGGLE (mobile)
   ============================================================ */

function initSidebar() {
  const toggle  = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!toggle || !sidebar) return;

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('is-open');
    if (overlay) overlay.classList.toggle('is-open');
  });

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('is-open');
      overlay.classList.remove('is-open');
    });
  }
}

/* ============================================================
   NOTIFICATION BELL
   ============================================================ */

function initNotifications() {
  const btn      = document.getElementById('notifBtn');
  const dropdown = document.getElementById('notifDropdown');
  const clear    = document.getElementById('notifClear');
  const badge    = document.getElementById('notifBadge');
  if (!btn || !dropdown) return;

  btn.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.classList.toggle('is-open');
  });

  document.addEventListener('click', () => dropdown.classList.remove('is-open'));
  dropdown.addEventListener('click', e => e.stopPropagation());

  if (clear) {
    clear.addEventListener('click', () => {
      document.querySelectorAll('.notif-item--unread').forEach(el =>
        el.classList.remove('notif-item--unread')
      );
      if (badge) badge.style.display = 'none';
    });
  }
}

/* ============================================================
   INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  const user = requireAuth();
  if (!user) return;   /* redirect already triggered */

  initProfile(user);
  initSidebar();
  initNotifications();
  initLogout();
});