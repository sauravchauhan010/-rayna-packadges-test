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
    state.agentDraft = { companyName: '', agentCode: '', password: '' };
  }
}

window.handleAgentStartEdit = (id) => {
  const agent = state.agents.find(a => a.id === id);
  if (!agent) return;
  state.editingAgentId = id;
  state.agentDraft = { companyName: agent.companyName || '', agentCode: agent.agentCode || '', password: agent.password || '' };
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

  if (!companyName || !agentCodeRaw || !password) {
    state.agentFormError = 'Company name, agent code, and password are all required.';
    render(); return;
  }

  const agentCode = agentCodeRaw;

  const duplicate = state.agents.find(a => (a.agentCode || '') === agentCode && a.id !== state.editingAgentId);
  if (duplicate) {
    state.agentFormError = `Agent code "${agentCode}" is already in use. Choose a different code or edit the existing entry.`;
    render(); return;
  }

  const payload = { companyName, agentCode, password, createdAt: new Date().toISOString() };

  if (!isFirebaseReady || !db) {
    if (state.editingAgentId) {
      state.agents = state.agents.map(a => a.id === state.editingAgentId ? { ...a, ...payload } : a);
    } else {
      state.agents = [...state.agents, { id: 'agt-' + Date.now(), ...payload }];
    }
    saveLocal('rayna_agents_v1', state.agents);
    state.agentFormSuccess = state.editingAgentId ? 'Access updated.' : 'Agent access granted.';
    state.editingAgentId = null;
    state.agentDraft = { companyName: '', agentCode: '', password: '' };
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
    state.agentDraft = { companyName: '', agentCode: '', password: '' };
  } catch (err) {
    state.agentFormError = 'Database error: ' + err.message;
  }
  render();
};
