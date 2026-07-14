import { state, esc } from './state.js';
import { isFirebaseReady, db } from './firebase.js';
import {
  renderCustomer,
  renderHotels,
  renderLogin,
  renderAdmin,
  renderPreviewModal,
  renderDeleteConfirmationModal,
  renderAgentLoginModal
} from './views.js';

function getView() {
  const p = new URLSearchParams(window.location.search);
  if (p.has('admin')) return state.isLoggedIn ? 'admin' : 'admin-login';
  return 'customer';
}

  export function render() {
    const container = document.getElementById('app');
    if (!container) return;

    // Save current active input ID and cursor selection to prevent drop focus
    const activeId = document.activeElement ? document.activeElement.id : null;
    let selectionStart = null;
    let selectionEnd = null;
    if (activeId) {
      const activeEl = document.getElementById(activeId);
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        selectionStart = activeEl.selectionStart;
        selectionEnd = activeEl.selectionEnd;
      }
    }

    state.view = getView();

    const filtered = state.packages.filter(p => {
      const q = state.searchQuery.toLowerCase();
      const matchesSearch = !q || esc(p.title).toLowerCase().includes(q) || esc(p.highlight).toLowerCase().includes(q);
      const matchesCountry = state.selectedCountryFilter === 'All' || p.title === state.selectedCountryFilter;
      return matchesSearch && matchesCountry;
    });

    let html = '';

    // ── FLUID STICKY NAV WITH EMBEDDED SEARCH BOX ──
    html += `
    <header style="position: -webkit-sticky; position: sticky; top: 0; z-index: 50; background: #ffffff; box-shadow: 0 2px 12px rgba(10,22,40,0.06); border-bottom: 1px solid #ede9e1; width: 100%;">
      <div style="width:100%;padding:0 20px;height:58px;display:flex;justify-content:space-between;align-items:center;gap:16px;">
        
        <!-- View Toggle (moved here from center) + Status -->
        <div style="display:flex;align-items:center;gap:12px;flex-shrink:0;">
          ${state.view === 'customer' ? `
            <div class="view-toggle">
              <button class="view-toggle-btn ${state.activeView === 'packages' ? 'active' : ''}"
                onclick="dispatch('SWITCH_VIEW', 'packages')">
                ✈ Packages
              </button>
              <button class="view-toggle-btn ${state.activeView === 'hotels' ? 'active' : ''}"
                onclick="dispatch('SWITCH_VIEW', 'hotels')">
                🏨 Hotels
              </button>
            </div>
          ` : `
            <div class="hidden md:block" style="cursor:pointer;" onclick="dispatch('GO_HOME')">
              <div style="font-size:8px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(10,22,40,0.5);display:flex;align-items:center;gap:4px;margin-top:1px;">
                <span class="live-dot"></span>
                ${(isFirebaseReady && db) ? 'Cloud connected' : 'Local mode'}
              </div>
            </div>
          `}
        </div>

        <!-- Embedded Sticky Search Box (Only on customer page) -->
        ${state.view === 'customer' ? `
          <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">

            <!-- Search box — only visible in packages view -->
            ${state.activeView === 'packages' ? `
              <div style="position:relative;flex:1;max-width:300px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(10,22,40,0.4)" stroke-width="2" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  id="search-input"
                  placeholder="Search departures..."
                  value="${esc(state.searchQuery)}"
                  oninput="dispatch('SEARCH', this.value)"
                  style="width:100%;background:var(--cream);border:1px solid #ede9e1;border-radius:20px;padding:6px 12px 6px 32px;font-family:'DM Sans',sans-serif;font-size:12px;color:var(--navy);outline:none;transition:all 0.2s;"
                  onfocus="this.style.borderColor='var(--gold)';"
                  onblur="this.style.borderColor='#ede9e1';"
                />
              </div>
            ` : ''}

          </div>
        ` : ''}

        <!-- Actions -->
        <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
          ${state.isLoggedIn && state.view === 'admin' ? `
            <button class="btn-outline" style="font-size:10px;padding:6px 12px;border-radius:4px;" onclick="dispatch('LOGOUT')">
              Sign Out
            </button>
          ` : ''}
          ${state.view === 'admin-login' ? `
            <button class="btn-outline" style="font-size:10px;padding:6px 12px;border-radius:4px;" onclick="dispatch('GO_HOME')">
              ← Client Portal
            </button>
          ` : ''}
          ${state.view === 'customer' && !state.isLoggedIn ? `
            <a href="?admin" style="font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(10,22,40,0.5);text-decoration:none;" title="Admin Login" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color='rgba(10,22,40,0.5)'">Admin Access</a>
          ` : ''}
        </div>
      </div>
    </header>`;

    if (state.view === 'customer') {
      if (state.activeView === 'hotels') {
        html += renderHotels();
      } else {
        html += renderCustomer(filtered);
      }
    } else if (state.view === 'admin-login') {
      html += renderLogin();
    } else if (state.view === 'admin') {
      html += renderAdmin();
    }

    if (state.deleteTarget) {
      html += renderDeleteConfirmationModal();
    }

    if (state.showAgentLoginForm) {
      html += renderAgentLoginModal();
    }

    // ── STICKY FLOATING BADGE (BOTTOM-RIGHT): Designer Credit ──
    html += `
    <div style="position: fixed; bottom: 20px; right: 20px; z-index: 45; display: flex; align-items: center; gap: 6px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); padding: 8px 14px; border-radius: 30px; border: 1px solid #ede9e1; box-shadow: 0 4px 12px rgba(10,22,40,0.08); font-size: 11px; color: rgba(10,22,40,0.6); transition: transform 0.2s ease-in-out;" class="hover:scale-105">
      <span>Designed & developed by</span>
      <a href="https://www.instagram.com/the_volleydrum" target="_blank" rel="noopener noreferrer" style="color:var(--gold); font-weight:700; text-decoration:none; border-bottom: 1px solid transparent; transition: border-color 0.2s;" onmouseover="this.style.borderBottomColor='var(--gold)'" onmouseout="this.style.borderBottomColor='transparent'">
        SAURAV CHAUHAN
      </a>
    </div>`;

    // ── STICKY FLOATING TRIGGER (BOTTOM-RIGHT - STACKED ABOVE CREDIT) ──
    const isScrolled = window.scrollY > 300;
    const scrollClasses = isScrolled 
      ? "opacity-100 translate-y-0 hover:scale-105 active:scale-95" 
      : "opacity-0 translate-y-4 pointer-events-none hover:scale-105 active:scale-95";

    html += `
    <button 
      id="back-to-top" 
      onclick="window.scrollTo({ top: 0, behavior: 'smooth' })"
      style="position:fixed; bottom:74px; right:20px; z-index:50; width:44px; height:44px; border-radius:50%; background:var(--navy); border:1px solid var(--gold); color:var(--gold); display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 4px 12px rgba(10,22,40,0.15); transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);"
      class="${scrollClasses}"
      title="Go to Top"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </button>
    `;

    html += renderPreviewModal();
    container.innerHTML = html;

    // Restore focus and cursor positions smoothly
    if (activeId) {
      const restoreEl = document.getElementById(activeId);
      if (restoreEl) {
        restoreEl.focus();
        if (selectionStart !== null && selectionEnd !== null && typeof restoreEl.setSelectionRange === 'function') {
          restoreEl.setSelectionRange(selectionStart, selectionEnd);
        }
      }
    }
  }
