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
export const SHEETS_ID = '1DqDfJb6My3mPMlArN02czNR7LlEv1I_iwW5NiIb4aiM';
export const SHEETS_RANGE = 'Sheet1';

// Google Drive folder whose file *list* is fetched via /api/drive-folder
// (the actual Drive API key lives server-side only — see api/drive-folder.js)
export const DRIVE_FOLDER_ID = '1mB1pOWQMtNgP06NeDXzjjBSx6MRCiccG';

// NOTE: previously this file exported a hardcoded SEED_PACKAGES array (4 fake
// demo packages: Switzerland/France/UK/Italy) used as a fallback whenever
// Firebase failed to load. That's been removed on purpose — a genuine
// connection problem should never silently render fake content that looks
// like real live packages. See js/db.js and js/db-packages.js for the
// proper "not configured / timed out / genuinely empty" handling instead.
