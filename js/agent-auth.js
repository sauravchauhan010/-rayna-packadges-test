// ─── AGENT LOGIN (agent code + password) ────────────────────────────────────
// No email, no OTP, no Firebase Auth email sending involved — the admin sets
// a Company Name, Agent Code, and Password per agent in the admin panel, and
// this checks those two credentials directly against the Firestore agents
// list (a free, uncapped read). Handles any login volume at zero cost.

import { state } from './state.js';
import { render } from './render.js';
import { fetchFolderSheets } from './drive.js';
import { recordAgentLogin } from './db-logs.js';

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

  // Give the agents listener a brief moment to finish loading on a cold start
  let attempts = 0;
  while (!state.agentsLoaded && attempts < 20) {
    await new Promise(r => setTimeout(r, 150));
    attempts++;
  }

  const match = state.agents.find(a => (a.agentCode || '') === agentCode);

  if (!match) {
    state.agentLoginLoading = false;
    state.agentLoginError = 'This agent code is not recognized. Please contact the admin team for access.';
    render();
    return;
  }

  if (match.password !== password) {
    state.agentLoginLoading = false;
    state.agentLoginError = 'Incorrect password. Please check and try again.';
    render();
    return;
  }

  state.agentUnlocked = agentCode;
  state.agentCompanyName = match.companyName || '';
  localStorage.setItem('rayna_agent_code', agentCode);
  localStorage.setItem('rayna_agent_company', state.agentCompanyName);
  state.activeView = 'hotels';
  state.agentLoginLoading = false;
  state.showAgentLoginForm = false;

  let location = 'Unknown';
  try {
    const locRes = await fetch('/api/agent-location');
    if (locRes.ok) {
      const locJson = await locRes.json();
      location = locJson.location || 'Unknown';
    }
  } catch (err) {
    console.warn('Could not determine agent location:', err);
  }
  recordAgentLogin(state.agentCompanyName, agentCode, location);

  await fetchFolderSheets();
  render();
};

window.agentLogout = () => {
  state.agentUnlocked    = '';
  state.agentCompanyName = '';
  state.folderFetched    = false;
  state.folderSheets     = [];
  state.activeSheetId    = null;
  state.activeSheetName  = '';
  state.agentLoginError  = '';
  localStorage.removeItem('rayna_agent_code');
  localStorage.removeItem('rayna_agent_company');
  render();
};
