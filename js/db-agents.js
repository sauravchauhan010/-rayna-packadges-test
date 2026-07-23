// ─── ADMIN: AGENT ACCESS LIST ────────────────────────────────────────────────
// This used to talk to Firestore directly from the browser via a live
// listener, which meant every visitor's browser loaded the full agent list
// — including plaintext passwords — regardless of whether they were logged
// in as admin. Now all of this goes through /api/agents, which requires a
// valid signed admin session cookie and never returns password data at all.

import { state } from './state.js';
import { render } from './render.js';

export async function loadAgents() {
  state.agentsLoaded = false;
  render();
  try {
    const res = await fetch('/api/agents');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not load agents.');
    state.agents = (data.agents || []).sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  } catch (err) {
    console.error('Agents load error:', err);
    state.agents = [];
  }
  state.agentsLoaded = true;
  render();
}

export async function deleteAgent(id) {
  await fetch('/api/agents', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  if (state.editingAgentId === id) {
    state.editingAgentId = null;
    state.agentDraft = { companyName: '', agentCode: '', password: '' };
  }
  await loadAgents();
}

window.handleAgentStartEdit = (id) => {
  const agent = state.agents.find(a => a.id === id);
  if (!agent) return;
  state.editingAgentId = id;
  // Password is intentionally left blank — the server never sends it back.
  // Leaving this field blank on save means "keep the current password".
  state.agentDraft = { companyName: agent.companyName || '', agentCode: agent.agentCode || '', password: '' };
  state.agentFormError = '';
  state.agentFormSuccess = '';
  render();
};

window.handleAgentCancelEdit = () => {
  state.editingAgentId = null;
  state.agentDraft = { companyName: '', agentCode: '', password: '' };
  state.agentFormError = '';
  state.agentFormSuccess = '';
  render();
};

window.handleAgentSubmit = async (e) => {
  e.preventDefault();
  state.agentFormError = '';
  state.agentFormSuccess = '';

  const companyName = document.getElementById('f-agt-company')?.value?.trim();
  const agentCodeRaw = document.getElementById('f-agt-agentcode')?.value?.trim();
  const password      = document.getElementById('f-agt-password')?.value; // no trim — password chars are intentional

  if (!companyName || !agentCodeRaw) {
    state.agentFormError = 'Company name and agent code are required.';
    render(); return;
  }
  if (!state.editingAgentId && !password) {
    state.agentFormError = 'A password is required when granting new access.';
    render(); return;
  }

  const agentCode = agentCodeRaw;

  try {
    let res, data;
    if (state.editingAgentId) {
      const body = { id: state.editingAgentId, companyName, agentCode };
      if (password) body.password = password; // blank = keep existing password
      res = await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update agent.');
      state.agentFormSuccess = 'Access updated successfully.';
    } else {
      res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, agentCode, password })
      });
      data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create agent.');
      state.agentFormSuccess = 'Agent access granted successfully.';
    }
    state.editingAgentId = null;
    state.agentDraft = { companyName: '', agentCode: '', password: '' };
    await loadAgents();
  } catch (err) {
    state.agentFormError = err.message;
    render();
  }
};
