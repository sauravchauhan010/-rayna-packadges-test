import { auth, db, isFirebaseReady, onAuthStateChanged } from './firebase.js';
import { state } from './state.js';
import { render } from './render.js';
import { attachPackagesListener, loadLocalPackages } from './db-packages.js';
import { attachAgentsListener, loadLocalAgents } from './db-agents.js';
import { attachLogsListener, loadLocalLogs } from './db-logs.js';

export function loadLocalFallback() {
  loadLocalPackages();
  loadLocalAgents();
  loadLocalLogs();
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
    attachAgentsListener();
    attachLogsListener();
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
