// ─── APP-LEVEL CONFIG ────────────────────────────────────────────────────────
// Firebase's client config is designed to be public — your real security
// boundary is Firestore rules, not hiding these values.

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDLIMISKaknbAIqwHrbk8xIbMjETktlzwU",
  authDomain: "packadge-itenary.firebaseapp.com",
  projectId: "packadge-itenary",
  storageBucket: "packadge-itenary.firebasestorage.app",
  messagingSenderId: "482476048193",
  appId: "1:482476048193:web:4164c8c466c5e856b96bc0"
};

// Reverted default APP_ID back to 'smc-tours-portal-v2' so legacy cloud entries load
export let APP_ID = 'smc-tours-portal-v2';
if (typeof window.__app_id !== 'undefined' && window.__app_id) {
  APP_ID = window.__app_id;
}

// Google Sheets (public "anyone with link" htmlview embed — needs no API key)
export const SHEETS_ID = '1DqDfJb6My3mPMlArN02czNR7LlEv1I_iwW5NiIb4ai';
export const SHEETS_RANGE = 'Sheet1';

// Google Drive folder whose file *list* is fetched via /api/drive-folder
// (the actual Drive API key lives server-side only — see api/drive-folder.js)
export const DRIVE_FOLDER_ID = '1mB1pOWQMtNgP06NeDXzjjBSx6MRCiccG';

export const SEED_PACKAGES = [
  {
    id: 'seed-1',
    title: 'Switzerland',
    duration: '3 Nights / 4 Days',
    highlight: 'Zurich 3N',
    image: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?auto=format&fit=crop&w=800&q=80',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    createdAt: new Date().toISOString()
  },
  {
    id: 'seed-2',
    title: 'France',
    duration: '4 Nights / 5 Days',
    highlight: 'Paris 4N',
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    createdAt: new Date().toISOString()
  },
  {
    id: 'seed-3',
    title: 'United Kingdom',
    duration: '5 Nights / 6 Days',
    highlight: 'London 5N',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ca1ad?auto=format&fit=crop&w=800&q=80',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    createdAt: new Date().toISOString()
  },
  {
    id: 'seed-4',
    title: 'Italy',
    duration: '5 Nights / 6 Days',
    highlight: 'Rome 3N + Florence 2N',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    createdAt: new Date().toISOString()
  }
];
