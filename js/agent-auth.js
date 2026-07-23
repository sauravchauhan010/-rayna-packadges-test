// ─── AGENT LOGIN (agent code + password) ────────────────────────────────────
// The password check used to happen in the browser against a full agents
// list (with plaintext passwords) that a live Firestore listener loaded for
// every visitor. Now the browser only ever sends the entered code + password
// to /api/agent-login, which checks a bcrypt hash server-side and sets a
// signed session cookie on success. The agents list never reaches the client.

import { state } from './state.js';
import { render } from './render.js';
import { fetchFolderSheets } from './drive.js';

window.handleAgentLogin = async () => {
  const codeEl = document.getElementById('agent-code-input');
  const passEl = document.getElementById('agent-password-input');
  const agentCode = (codeEl ? codeEl.value : '').trim();
  const password = passEl ? passEl.value : '';

  state.agentLoginError = '';

  if (!agentCode) {
    state.agentLoginError = 'Please enter your agent code.';
    render();
    return;
  }
  if (!password) {
    state.agentLoginError = 'Please enter your password.';
    render();
    return;
  }

  state.agentLoginLoading = true;
  render();

  try {
    const res = await fetch('/api/agent-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentCode, password })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      state.agentLoginLoading = false;
      state.agentLoginError = data.error || 'Incorrect agent code or password.';
      render();
      return;
    }

    state.agentUnlocked = agentCode;
    state.agentCompanyName = data.companyName || '';
    state.activeView = 'hotels';
    state.agentLoginLoading = false;
    state.showAgentLoginForm = false;

    await fetchFolderSheets();
    render();
  } catch (err) {
    state.agentLoginLoading = false;
    state.agentLoginError = 'Network error. Please try again.';
    render();
  }
};

window.agentLogout = () => {
  state.agentUnlocked    = '';
  state.agentCompanyName = '';
  state.folderFetched    = false;
  state.folderSheets     = [];
  state.activeSheetId    = null;
  state.activeSheetName  = '';
  state.agentLoginError  = '';
  fetch('/api/agent-logout', { method: 'POST' }).catch(() => {});
  render();
};
