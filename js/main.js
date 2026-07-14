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

window.addEventListener('popstate', render);

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

window.onload = async () => {
  await initAuth(state);
  setupListeners();

  if (state.agentUnlocked) {
    // Restore agent session if previously logged in
    fetchFolderSheets();
  }

  render();
};
