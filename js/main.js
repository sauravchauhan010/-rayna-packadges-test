// ─── ENTRY POINT ─────────────────────────────────────────────────────────────
// Importing these modules attaches their window.* handlers as a side effect
// (each module registers the onclick/onsubmit handlers its views reference).
import './admin-auth.js';
import './dispatch.js';
import './drive.js';
import './db-packages.js';
import './db-agents.js';
import './db-logs.js';
import './agent-auth.js';

import { initAuth, isFirebaseReady } from './firebase.js';
import { setupListeners, startLoadWatchdog } from './db.js';
import { state } from './state.js';
import { render } from './render.js';
import { fetchFolderSheets } from './drive.js';
import { loadAgents } from './db-agents.js';
import { loadLogs } from './db-logs.js';

window.addEventListener('popstate', render);

window.addEventListener('resize', () => {
  const headerEl = document.querySelector('header');
  if (headerEl) {
    document.documentElement.style.setProperty('--rayna-header-h', headerEl.offsetHeight + 'px');
  }
});

window.addEventListener('scroll', () => {
  const btn = document.getElementById('back-to-top');
  if (btn) {
    if (window.scrollY > 300) {
      btn.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
      btn.classList.add('opacity-100', 'translate-y-0');
    } else {
      btn.classList.remove('opacity-100', 'translate-y-0');
      btn.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
    }
  }
});

startLoadWatchdog();

async function checkAdminSession() {
  try {
    const res = await fetch('/api/session-check');
    const data = await res.json();
    state.isLoggedIn = !!data.loggedIn;
  } catch (err) {
    state.isLoggedIn = false;
  }
  state.authChecked = true;
}

async function checkAgentSession() {
  try {
    const res = await fetch('/api/agent-session-check');
    const data = await res.json();
    if (data.loggedIn) {
      state.agentUnlocked = data.agentCode || '';
      state.agentCompanyName = data.companyName || '';
    }
  } catch (err) {
    // no-op — stays locked out
  }
  state.agentSessionChecked = true;
}

// Sheets ID can be set per-deployment via a Vercel env var (see
// api/config.js) instead of a code edit. state.sheetsId already starts
// with the hardcoded fallback from config.js, so if this fails or is slow,
// the app just keeps using that — never blocks or breaks anything.
async function fetchSheetsConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    if (data.sheetsId) state.sheetsId = data.sheetsId;
  } catch (err) {
    // no-op — keeps the hardcoded fallback already in state.sheetsId
  }
}

window.onload = async () => {
  // initAuth (Firebase sign-in) and the two session checks are independent
  // of each other — run them in parallel instead of one after another to
  // shave a full network round-trip off the initial load.
  const authThenListeners = initAuth(state).then(() => setupListeners());

  await Promise.all([authThenListeners, checkAdminSession(), checkAgentSession(), fetchSheetsConfig()]);

  if (state.agentUnlocked) {
    fetchFolderSheets();
  }
  if (state.isLoggedIn) {
    loadAgents();
    loadLogs();
  }

  render();
};
