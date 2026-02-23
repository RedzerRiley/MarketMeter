/* ============================================================
   MarketMeter — app.js
   Shared JS for authenticated pages (dashboard, submit-price)
   Handles: sidebar toggle, notification bell, profile population
   ============================================================ */

'use strict';

/* ============================================================
   SIDEBAR TOGGLE (mobile)
   ============================================================ */

function initSidebar() {
  var toggle  = document.getElementById('sidebarToggle');
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebarOverlay');
  if (!toggle || !sidebar) return;

  toggle.addEventListener('click', function () {
    sidebar.classList.toggle('is-open');
    if (overlay) overlay.classList.toggle('is-open');
  });

  if (overlay) {
    overlay.addEventListener('click', function () {
      sidebar.classList.remove('is-open');
      overlay.classList.remove('is-open');
    });
  }
}

/* ============================================================
   NOTIFICATION BELL
   ============================================================ */

function initNotifications() {
  var btn      = document.getElementById('notifBtn');
  var dropdown = document.getElementById('notifDropdown');
  var clear    = document.getElementById('notifClear');
  var badge    = document.getElementById('notifBadge');
  if (!btn || !dropdown) return;

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    dropdown.classList.toggle('is-open');
  });

  document.addEventListener('click', function () {
    dropdown.classList.remove('is-open');
  });

  dropdown.addEventListener('click', function (e) {
    e.stopPropagation();
  });

  if (clear) {
    clear.addEventListener('click', function () {
      document.querySelectorAll('.notif-item--unread').forEach(function (item) {
        item.classList.remove('notif-item--unread');
        var dot = item.querySelector('.notif-dot');
        if (dot) dot.style.backgroundColor = 'var(--border)';
      });
      if (badge) badge.style.display = 'none';
    });
  }
}

/* ============================================================
   PROFILE POPULATION
   Reads from localStorage key 'mmUser' (set by auth/login flow)

   BACKEND DEVELOPER:
   On successful login, save the user object to localStorage:
     localStorage.setItem('mmUser', JSON.stringify({
       fullName:    'Juan dela Cruz',
       email:       'juan@example.com',
       memberSince: 'Jan 2025',
       submissions: 12
     }));
   Then this function will auto-populate all sidebar fields.
   ============================================================ */

function initProfile() {
  var raw  = localStorage.getItem('mmUser');
  var user = raw ? JSON.parse(raw) : null;

  /* Fallback placeholder values when no session exists */
  var fullName    = user && user.fullName    ? user.fullName    : 'Guest User';
  var email       = user && user.email       ? user.email       : 'guest@marketmeter.ph';
  var memberSince = user && user.memberSince ? user.memberSince : '—';
  var submissions = user && user.submissions !== undefined ? user.submissions : 0;

  /* Avatar initials */
  function getInitials(name) {
    var parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  function setEl(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  setEl('avatarInitials',  getInitials(fullName));
  setEl('profileName',     fullName);
  setEl('profileEmail',    email);
  setEl('statSubmissions', submissions);
  setEl('statMemberSince', memberSince);

  /* Welcome name (first name only) */
  var firstName = fullName.split(' ')[0];
  setEl('welcomeName', firstName);
}

/* ============================================================
   INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  initSidebar();
  initNotifications();
  initProfile();
});