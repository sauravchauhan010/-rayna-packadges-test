import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { db, isFirebaseReady } from './firebase.js';
import { APP_ID, SEED_PACKAGES } from './config.js';
import { state, saveLocal } from './state.js';
import { render } from './render.js';

export function loadLocalPackages() {
  try {
    const localPkgs = localStorage.getItem('rayna_pkgs_v4');
    state.packages = localPkgs ? JSON.parse(localPkgs) : [...SEED_PACKAGES];
    if (!localPkgs) localStorage.setItem('rayna_pkgs_v4', JSON.stringify(state.packages));
  } catch (_) {
    state.packages = [...SEED_PACKAGES];
  }
}

// Attaches the live Firestore listener for packages. Falls back to local
// storage if Firestore isn't reachable.
export function attachPackagesListener(onFallback) {
  const pkgsCol = collection(db, 'artifacts', APP_ID, 'public', 'data', 'packages');
  onSnapshot(pkgsCol, (snap) => {
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    state.packages = list;
    state.isDbLoading = false;
    render();
  }, err => {
    console.error('Packages listener error:', err);
    onFallback();
  });
}

export async function deletePackage(id) {
  if (!isFirebaseReady || !db) {
    state.packages = state.packages.filter(p => p.id !== id);
    saveLocal('rayna_pkgs_v4', state.packages);
  } else {
    await fetch('/api/packages', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
  }
  if (state.editingId === id) {
    state.editingId = null;
    state.draft = { title: '', duration: '', highlight: '', image: '', pdfUrl: '' };
  }
}

window.handleStartEdit = (id) => {
  const pkg = state.packages.find(p => p.id === id);
  if (!pkg) return;
  state.editingId = id;
  state.draft = { title: pkg.title, duration: pkg.duration, highlight: pkg.highlight, image: pkg.image || '', pdfUrl: pkg.pdfUrl };
  state.formError = '';
  state.formSuccess = '';
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.handleCancelEdit = () => {
  state.editingId = null;
  state.draft = { title: '', duration: '', highlight: '', image: '', pdfUrl: '' };
  state.formError = '';
  state.formSuccess = '';
  render();
};

window.handlePackageSubmit = async (e) => {
  e.preventDefault();
  state.formError = '';
  state.formSuccess = '';

  const title     = document.getElementById('f-title')?.value?.trim();
  const duration  = document.getElementById('f-duration')?.value?.trim();
  const highlight = document.getElementById('f-highlight')?.value?.trim();
  const image     = document.getElementById('f-image')?.value?.trim();
  const pdfUrl    = document.getElementById('f-pdf')?.value?.trim();

  if (!title || !duration || !pdfUrl) {
    state.formError = 'Country title, duration, and PDF link are required.';
    render(); return;
  }

  try { new URL(pdfUrl); } catch (_) {
    state.formError = 'Please enter a valid PDF URL (must start with https://).';
    render(); return;
  }

  const payload = {
    title: title.trim(),
    duration: duration.trim(),
    highlight: highlight || '',
    image: image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80',
    pdfUrl,
    createdAt: new Date().toISOString()
  };

  if (!isFirebaseReady || !db) {
    if (state.editingId) {
      state.packages = state.packages.map(p => p.id === state.editingId ? { ...p, ...payload } : p);
    } else {
      state.packages = [{ id: 'pkg-' + Date.now(), ...payload }, ...state.packages];
    }
    saveLocal('rayna_pkgs_v4', state.packages);
    state.editingId = null;
    state.draft = { title: '', duration: '', highlight: '', image: '', pdfUrl: '' };
    state.formSuccess = 'Package saved.';
    render(); return;
  }

  try {
    if (state.editingId) {
      const res = await fetch('/api/packages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: state.editingId, ...payload })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update package.');
      state.formSuccess = 'Package updated successfully.';
    } else {
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create package.');
      state.formSuccess = 'Package published successfully.';
    }
    state.editingId = null;
    state.draft = { title: '', duration: '', highlight: '', image: '', pdfUrl: '' };
  } catch (err) {
    state.formError = err.message;
  }
  render();
};
