// ─── ENTRY POINT ─────────────────────────────────────────────────────────────
// Importing these modules attaches their window.* handlers as a side effect
// (each module registers the onclick/onsubmit handlers its views reference).
import './admin-auth.js';
import './dispatch.js';
import './drive.js';
import './db-packages.js';
import './db-agents.js';
import './agent-auth.js';

import { initAuth, isFirebaseReady } from './firebase.js';
import { setupListeners, startLoadWatchdog } from './db.js';
import { state } from './state.js';
import { render } from './render.js';
import { fetchFolderSheets } from './drive.js';
import { completeAgentEmailLinkSignIn, hasPendingAgentSignInLink } from './agent-auth.js';

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

  const hasEmailLink = hasPendingAgentSignInLink();

  if (hasEmailLink && state.agentUnlocked) {
    // Already signed in this session (link opened/clicked again) — don't re-redeem the
    // one-time code, just clean the URL and drop the agent straight into private files.
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
    state.activeView = 'hotels';
    if (!state.folderFetched) fetchFolderSheets();
  } else if (hasEmailLink) {
    await completeAgentEmailLinkSignIn();
  } else if (state.agentUnlocked) {
    // Restore agent session if previously logged in
    fetchFolderSheets();
  }

  render();
};
