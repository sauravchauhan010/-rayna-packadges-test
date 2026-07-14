// ─── SHARED APP STATE ────────────────────────────────────────────────────────
// A single mutable object, imported by reference everywhere. Any module can
// read/write `state.someField` and call render() to reflect the change —
// same model as the original single-file version, just split across modules.

export const state = {
  view: 'customer',
  isLoggedIn: sessionStorage.getItem('rayna_admin_auth') === 'true',
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

  // Agent (agent code + password) login — no email, no Firebase sending, no volume limits
  agents: [],                                             // [{id, companyName, agentCode, password, createdAt}]
  agentsLoaded: false,
  agentUnlocked: localStorage.getItem('rayna_agent_code') || '',
  agentCompanyName: localStorage.getItem('rayna_agent_company') || '',
  agentLoginError: '',
  agentLoginLoading: false,
  showAgentLoginForm: false,
  folderSheets: [],
  folderLoading: false,
  folderFetched: false,
  folderError: '',
  activeSheetId: null,
  activeSheetName: '',

  // Admin: Access List (agents) management
  adminSection: sessionStorage.getItem('rayna_admin_section') || 'packages', // 'packages' | 'agents'
  agentSearchQuery: '',
  agentFormError: '',
  agentFormSuccess: '',
  editingAgentId: null,
  agentDraft: { companyName: '', agentCode: '', password: '' },

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
