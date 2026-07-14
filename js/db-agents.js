import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { db, isFirebaseReady } from './firebase.js';
import { APP_ID } from './config.js';
import { state, saveLocal } from './state.js';
import { render } from './render.js';

export function loadLocalAgents() {
  try {
    const localAgents = localStorage.getItem('rayna_agents_v1');
    state.agents = localAgents ? JSON.parse(localAgents) : [];
  } catch (_) {
    state.agents = [];
  }
  state.agentsLoaded = true;
}

// Attaches the live Firestore listener for the agent Access List.
export function attachAgentsListener() {
  const agentsCol = collection(db, 'artifacts', APP_ID, 'public', 'data', 'agents');
  onSnapshot(agentsCol, (snap) => {
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    state.agents = list;
    state.agentsLoaded = true;
    render();
  }, err => {
    console.error('Agents listener error:', err);
    state.agentsLoaded = true;
  });
}

export async function deleteAgent(id) {
  if (!isFirebaseReady || !db) {
    state.agents = state.agents.filter(a => a.id !== id);
    saveLocal('rayna_agents_v1', state.agents);
  } else {
    await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'agents', id));
  }
  if (state.editingAgentId === id) {
    state.editingAgentId = null;
    state.agentDraft = { companyName: '', email: '' };
  }
}

window.handleAgentStartEdit = (id) => {
  const agent = state.agents.find(a => a.id === id);
  if (!agent) return;
  state.editingAgentId = id;
  state.agentDraft = { companyName: agent.companyName || '', email: agent.email || '' };
  state.agentFormError = '';
  state.agentFormSuccess = '';
  render();
};

window.handleAgentCancelEdit = () => {
  state.editingAgentId = null;
  state.agentDraft = { companyName: '', email: '' };
  state.agentFormError = '';
  state.agentFormSuccess = '';
  render();
};

window.handleAgentSubmit = async (e) => {
  e.preventDefault();
  state.agentFormError = '';
  state.agentFormSuccess = '';

  const companyName = document.getElementById('f-agt-company')?.value?.trim();
  const emailRaw     = document.getElementById('f-agt-email')?.value?.trim();

  if (!companyName || !emailRaw) {
    state.agentFormError = 'Company name and email are both required.';
    render(); return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
    state.agentFormError = 'Please enter a valid email address.';
    render(); return;
  }

  const email = emailRaw.toLowerCase();

  const duplicate = state.agents.find(a => (a.email || '').toLowerCase() === email && a.id !== state.editingAgentId);
  if (duplicate) {
    state.agentFormError = `Email "${email}" already has access. Choose a different email or edit the existing entry.`;
    render(); return;
  }

  const payload = { companyName, email, createdAt: new Date().toISOString() };

  if (!isFirebaseReady || !db) {
    if (state.editingAgentId) {
      state.agents = state.agents.map(a => a.id === state.editingAgentId ? { ...a, ...payload } : a);
    } else {
      state.agents = [...state.agents, { id: 'agt-' + Date.now(), ...payload }];
    }
    saveLocal('rayna_agents_v1', state.agents);
    state.agentFormSuccess = state.editingAgentId ? 'Access updated.' : 'Agent access granted.';
    state.editingAgentId = null;
    state.agentDraft = { companyName: '', email: '' };
    render(); return;
  }

  try {
    if (state.editingAgentId) {
      const ref = doc(db, 'artifacts', APP_ID, 'public', 'data', 'agents', state.editingAgentId);
      await updateDoc(ref, payload);
      state.agentFormSuccess = 'Access updated successfully.';
    } else {
      const col = collection(db, 'artifacts', APP_ID, 'public', 'data', 'agents');
      await addDoc(col, payload);
      state.agentFormSuccess = 'Agent access granted successfully.';
    }
    state.editingAgentId = null;
    state.agentDraft = { companyName: '', email: '' };
  } catch (err) {
    state.agentFormError = 'Database error: ' + err.message;
  }
  render();
};
