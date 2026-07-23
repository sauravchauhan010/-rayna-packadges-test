import { auth, db, isFirebaseReady, onAuthStateChanged } from './firebase.js';
import { state } from './state.js';
import { render } from './render.js';
import { attachPackagesListener, loadLocalPackages } from './db-packages.js';

// Agents and login logs no longer use client-side Firestore listeners —
// they're admin-only data and now load via /api/agents and /api/agent-logs
// (see js/db-agents.js / js/db-logs.js), only once an admin session is
// confirmed. Packages are public marketing content, so they still load
// straight from Firestore on the client — nothing sensitive there.

export function loadLocalFallback() {
  loadLocalPackages();
  state.isDbLoading = false;
  render();
}

export function setupListeners() {
  if (!isFirebaseReady || !db) {
    loadLocalFallback();
    return;
  }

  onAuthStateChanged(auth, (usr) => {
    state.user = usr;
    if (!usr) {
      if (state.isDbLoading) loadLocalFallback();
      return;
    }
    attachPackagesListener(loadLocalFallback);
  });
}

// Watchdog: if Firestore hasn't responded in time, fall back to local storage
// so the app is never stuck on a spinner.
export function startLoadWatchdog() {
  setTimeout(() => {
    if (state.isDbLoading) {
      console.warn('Database connection timed out. Booting local offline sandbox.');
      loadLocalFallback();
    }
  }, 3000);
}
