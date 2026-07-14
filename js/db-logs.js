import { collection, addDoc, onSnapshot, deleteDoc, doc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { db, isFirebaseReady } from './firebase.js';
import { APP_ID } from './config.js';
import { state, saveLocal } from './state.js';
import { render } from './render.js';

const LOCAL_KEY = 'agent_login_logs_v1';

export function loadLocalLogs() {
  try {
    const local = localStorage.getItem(LOCAL_KEY);
    state.agentLogs = local ? JSON.parse(local) : [];
  } catch (_) {
    state.agentLogs = [];
  }
  state.agentLogsLoaded = true;
}

// Attaches the live Firestore listener for agent login logs.
export function attachLogsListener() {
  const logsCol = collection(db, 'artifacts', APP_ID, 'public', 'data', 'agent_login_logs');
  onSnapshot(logsCol, (snap) => {
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    list.sort((a, b) => new Date(b.loggedAt || 0) - new Date(a.loggedAt || 0));
    state.agentLogs = list;
    state.agentLogsLoaded = true;
    render();
  }, err => {
    console.error('Agent logs listener error:', err);
    state.agentLogsLoaded = true;
  });
}

// Records a single successful agent login. Called only on a successful
// agent-code + password match — never on failed attempts or hotel-sheet views.
export async function recordAgentLogin(companyName, agentCode, location) {
  const entry = {
    companyName: companyName || '',
    agentCode: agentCode || '',
    location: location || 'Unknown',
    loggedAt: new Date().toISOString()
  };

  if (!isFirebaseReady || !db) {
    const updated = [{ id: 'log-' + Date.now(), ...entry }, ...state.agentLogs];
    state.agentLogs = updated;
    saveLocal(LOCAL_KEY, updated);
    return;
  }

  try {
    const col = collection(db, 'artifacts', APP_ID, 'public', 'data', 'agent_login_logs');
    await addDoc(col, entry);
  } catch (err) {
    console.error('Could not record agent login log:', err);
  }
}

export async function clearAllLogs() {
  if (!isFirebaseReady || !db) {
    state.agentLogs = [];
    saveLocal(LOCAL_KEY, []);
    return;
  }
  try {
    const col = collection(db, 'artifacts', APP_ID, 'public', 'data', 'agent_login_logs');
    const snap = await getDocs(col);
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'agent_login_logs', d.id))));
  } catch (err) {
    console.error('Could not clear agent login logs:', err);
  }
}
