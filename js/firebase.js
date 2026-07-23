import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { FIREBASE_CONFIG } from './config.js';

export let app = null;
export let auth = null;
export let db = null;
export let isFirebaseReady = false;

// Robust environment check for an injected Firebase config (kept for parity
// with the original single-file version; falls back to FIREBASE_CONFIG)
let firebaseConfig = FIREBASE_CONFIG;
if (typeof window.__firebase_config !== 'undefined' && window.__firebase_config) {
  try {
    firebaseConfig = JSON.parse(window.__firebase_config);
  } catch (e) {
    console.error("Error parsing injected window.__firebase_config:", e);
  }
}

isFirebaseReady = !!(firebaseConfig && firebaseConfig.apiKey);

if (isFirebaseReady) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.error('Firebase initialization error:', err);
    isFirebaseReady = false;
  }
}

export { onAuthStateChanged };

export async function initAuth(state) {
  if (!isFirebaseReady || !auth) {
    state.user = { uid: 'local-user' };
    return;
  }
  try {
    const token = typeof window.__initial_auth_token !== 'undefined' ? window.__initial_auth_token : null;
    if (token) {
      await signInWithCustomToken(auth, token);
    } else {
      await signInAnonymously(auth);
    }
  } catch (err) {
    console.warn('Authentication failed. Falling back to local offline sandbox directory.', err);
  }
}
