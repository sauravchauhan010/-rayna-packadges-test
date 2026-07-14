import { state } from './state.js';
import { render } from './render.js';
import { deletePackage } from './db-packages.js';
import { deleteAgent } from './db-agents.js';
import { clearAllLogs } from './db-logs.js';

window.dispatch = (action, payload) => {
  switch (action) {
    case 'SEARCH':
      state.searchQuery = payload;
      break;
    case 'ADMIN_SEARCH':
      state.adminSearchQuery = payload;
      break;
    case 'SET_COUNTRY_FILTER':
      state.selectedCountryFilter = payload;
      break;
    case 'LOGOUT': {
      state.isLoggedIn = false;
      sessionStorage.removeItem('rayna_admin_auth');
      const url = new URL(window.location);
      url.searchParams.delete('admin');
      window.history.pushState({}, '', url);
      break;
    }
    case 'GO_HOME': {
      const u2 = new URL(window.location);
      u2.searchParams.delete('admin');
      window.history.pushState({}, '', u2);
      break;
    }
    case 'SWITCH_VIEW':
      state.activeView = payload;
      break;
    case 'HOTEL_SEARCH':
      state.hotelSearch = payload;
      break;
    case 'FOLDER_SEARCH':
      state.folderSearch = payload;
      break;
    case 'TOGGLE_AGENT_LOGIN_FORM':
      state.showAgentLoginForm = !state.showAgentLoginForm;
      state.agentLoginError = '';
      break;
    case 'SWITCH_ADMIN_SECTION':
      state.adminSection = payload;
      sessionStorage.setItem('rayna_admin_section', payload);
      break;
    case 'AGENT_SEARCH':
      state.agentSearchQuery = payload;
      break;
    case 'ADMIN_LOG_SEARCH':
      state.adminLogSearchQuery = payload;
      break;
    case 'ADMIN_LOG_DATE_FROM':
      state.adminLogDateFrom = payload;
      break;
    case 'ADMIN_LOG_DATE_TO':
      state.adminLogDateTo = payload;
      break;
    case 'ADMIN_LOG_CLEAR_FILTERS':
      state.adminLogSearchQuery = '';
      state.adminLogDateFrom = '';
      state.adminLogDateTo = '';
      break;
    case 'ZOOM_OUT':
      state.previewZoom = Math.max(50, state.previewZoom - 25);
      break;
    case 'ZOOM_IN':
      state.previewZoom = Math.min(200, state.previewZoom + 25);
      break;
    case 'ZOOM_RESET':
      state.previewZoom = 100;
      break;
  }
  render();
};

// ─── Unified delete confirmation (packages + agents) ───────────────────────
window.triggerDeleteConfirmation = (id) => {
  state.deleteTarget = { type: 'package', id };
  render();
};

window.triggerAgentDeleteConfirmation = (id) => {
  state.deleteTarget = { type: 'agent', id };
  render();
};

window.triggerClearLogsConfirmation = () => {
  state.deleteTarget = { type: 'logs-all', id: null };
  render();
};

window.cancelDelete = () => {
  state.deleteTarget = null;
  render();
};

window.confirmDelete = async () => {
  const target = state.deleteTarget;
  if (!target) return;

  try {
    if (target.type === 'agent') {
      await deleteAgent(target.id);
    } else if (target.type === 'logs-all') {
      await clearAllLogs();
    } else {
      await deletePackage(target.id);
    }
  } catch (err) {
    console.error('Delete error:', err);
  }

  state.deleteTarget = null;
  render();
};
