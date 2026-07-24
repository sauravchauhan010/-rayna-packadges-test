// ─── SHARED APP STATE ────────────────────────────────────────────────────────
// A single mutable object, imported by reference everywhere. Any module can
// read/write `state.someField` and call render() to reflect the change —
// same model as the original single-file version, just split across modules.

import { SHEETS_ID } from './config.js';

export const state = {
  view: 'customer',
  // Real value comes from an async /api/session-check call (see main.js) —
  // starts false so a spoofed sessionStorage flag can no longer fake it in.
  isLoggedIn: false,
  authChecked: false,
  user: null,
  packages: [],
  isDbLoading: true,
  searchQuery: '',
  adminSearchQuery: '',
  selectedCountryFilter: 'All',
  loginError: '',
  loginLoading: false,
  formError: '',
  formSuccess: '',
  editingId: null,
  draft: { title: '', duration: '', highlight: '', image: '', pdfUrl: '' },

  // Unified delete confirmation: { type: 'package' | 'agent', id } or null
  deleteTarget: null,

  // Hotel view
  activeView: sessionStorage.getItem('rayna_view') || 'packages',   // 'packages' | 'hotels'
  folderSearch: '',
  hotelSearch: '',

  // Common sheet ID — starts as the hardcoded fallback, overwritten once
  // /api/config responds (lets it be set per-deployment via a Vercel env
  // var instead of a code edit; see main.js and api/config.js).
  sheetsId: SHEETS_ID,

  // Cached common-sheet data (fetched lazily on first search) used to
  // power real row matching above the embedded sheet iframe.
  hotelSheetCols: [],
  hotelSheetRows: [],
  hotelSheetDataLoading: false,
  hotelSheetDataLoaded: false,
  hotelSheetDataError: '',

  // Agent (agent code + password) login — checked server-side against
  // hashed passwords; the browser never holds the agents list at all.
  agents: [],                                             // admin-only, loaded via /api/agents (no passwords)
  agentsLoaded: false,
  agentSessionChecked: false,
  agentUnlocked: '',        // set only after a verified /api/agent-session-check or a fresh login
  agentCompanyName: '',
  agentLoginError: '',
  agentLoginLoading: false,
  showAgentLoginForm: false,
  folderSheets: [],
  folderLoading: false,
  folderFetched: false,
  folderError: '',
  activeSheetId: null,
  activeSheetName: '',
  // Folder navigation (local-explorer style). Stack always starts with the
  // root; id: null means "root" (server resolves it via DRIVE_FOLDER_ID).
  // Navigating into a subfolder pushes onto the stack; clicking a
  // breadcrumb truncates the stack back to that point.
  folderStack: [{ id: null, name: 'Home' }],

  // Admin: Access List (agents) management
  adminSection: sessionStorage.getItem('rayna_admin_section') || 'packages', // 'packages' | 'agents' | 'logs'
  agentSearchQuery: '',
  agentFormError: '',
  agentFormSuccess: '',
  editingAgentId: null,
  agentDraft: { companyName: '', agentCode: '', password: '' },

  // Admin: Agent Login Logs (records successful agent sign-ins only)
  agentLogs: [],
  agentLogsLoaded: false,
  adminLogSearchQuery: '',
  adminLogDateFrom: '',
  adminLogDateTo: '',

  // File preview modal
  previewFile: null,
  previewZoom: 100,
  previewOpenedAt: 0
};

export function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function pkgJson(pkg) {
  return JSON.stringify(pkg).replace(/"/g, '&quot;');
}

export function saveLocal(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (_) { /* ignore */ }
}
