// ─── ADMIN: AGENT LOGIN LOGS ─────────────────────────────────────────────────
// Login recording now happens server-side inside /api/agent-login (using a
// server-trusted IP/location header, not whatever the client reports).
// Reading and clearing logs here goes through /api/agent-logs, which
// requires a valid admin session — this used to be a live Firestore
// listener any visitor's browser could read.

import { state } from './state.js';
import { render } from './render.js';

export async function loadLogs() {
  state.agentLogsLoaded = false;
  render();
  try {
    const res = await fetch('/api/agent-logs');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not load logs.');
    state.agentLogs = (data.logs || []).sort((a, b) => new Date(b.loggedAt || 0) - new Date(a.loggedAt || 0));
  } catch (err) {
    console.error('Logs load error:', err);
    state.agentLogs = [];
  }
  state.agentLogsLoaded = true;
  render();
}

export async function clearAllLogs() {
  try {
    await fetch('/api/agent-logs', { method: 'DELETE' });
  } catch (err) {
    console.error('Could not clear agent login logs:', err);
  }
  await loadLogs();
}
