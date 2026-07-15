import { isFirebaseReady, db } from './firebase.js';
import { state, esc, pkgJson } from './state.js';
import { SHEETS_ID } from './config.js';

  function fileIcon(mimeType) {
    if (mimeType === 'application/vnd.google-apps.spreadsheet') return { icon: '🟢', label: 'Google Sheet', color: '#16a34a' };
    if (mimeType === 'application/pdf')                          return { icon: '📄', label: 'PDF',          color: '#dc2626' };
    if (mimeType.includes('spreadsheetml') || mimeType.includes('excel')) return { icon: '📊', label: 'Excel', color: '#15803d' };
    if (mimeType === 'application/vnd.google-apps.document')    return { icon: '📝', label: 'Doc',          color: '#2563eb' };
    if (mimeType.includes('presentation'))                       return { icon: '📑', label: 'Slides',       color: '#d97706' };
    return { icon: '📁', label: 'File', color: '#6b7280' };
  }

  export function renderCustomer(filtered) {
    const destinations = ['All', ...new Set(state.packages.map(p => p.title))];

    return `
    <main style="flex: 1; width: 100%; padding-bottom: 80px;">
      <div class="hero-bg" style="position:relative;padding:48px 20px;text-align:center;">
        <div style="max-width:680px;margin:0 auto;position:relative;z-index:2;">
          <div style="display:inline-block;border:1px solid rgba(201,168,76,0.3);color:var(--gold);font-size:9px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;padding:4px 14px;border-radius:20px;margin-bottom:12px;">
            Premium Departures
          </div>
          <h1 style="font-family:'Cormorant Garamond',serif;font-size:clamp(28px,5vw,42px);font-weight:700;color:#fff;line-height:1.15;margin-bottom:10px;">
            Explore the World, <em style="color:var(--gold);font-style:normal;">In Style</em>
          </h1>
          <p style="color:rgba(255,255,255,0.6);font-size:13px;max-width:440px;margin:0 auto;font-weight:300;line-height:1.5;">
            Premium itineraries tailored for discerning groups. Get instant itinerary access and directly connect with us via WhatsApp to book.
          </p>
        </div>
      </div>

      <!-- Fluid Width Filter Bar -->
      <section style="padding:20px 20px 0;background:#fff;border-bottom:1px solid #ede9e1; width: 100%;">
        <div style="width:100%; padding: 0 10px;">
          <div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
            <span style="font-size:9px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#888;">Filter by Destination</span>
            <div style="display:flex;gap:8px;overflow-x:auto;width:100%;padding-bottom:16px;scrollbar-width:none;" class="justify-start md:justify-center no-scrollbar">
              ${destinations.map(country => {
                const isSelected = state.selectedCountryFilter === country;
                return `
                  <button 
                    onclick="dispatch('SET_COUNTRY_FILTER', '${esc(country)}')"
                    style="
                      white-space:nowrap;
                      font-family:'DM Sans',sans-serif;
                      font-size:11px;
                      font-weight:600;
                      letter-spacing:0.04em;
                      padding:6px 14px;
                      border-radius:30px;
                      cursor:pointer;
                      transition:all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                      border:1px solid ${isSelected ? 'var(--gold)' : '#ede9e1'};
                      background: ${isSelected ? 'var(--navy)' : '#fff'};
                      color: ${isSelected ? 'var(--gold)' : 'var(--navy)'};
                    "
                  >
                    ${esc(country)}
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </section>

      <!-- Fully Fluid Catalog Grid spanning edge-to-edge -->
      <section style="padding:40px 20px;background:var(--cream); width:100%;">
        <div style="width:100%; padding: 0 10px;">
          
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
            <div>
              <h2 style="font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:700;margin:0;">Curated Journeys</h2>
            </div>
            <span style="font-size:11px;font-weight:500;color:#666;background:#fff;border:1px solid #ede9e1;padding:4px 10px;border-radius:4px;">
              Showing ${filtered.length} departure${filtered.length === 1 ? '' : 's'}
            </span>
          </div>

          ${state.isDbLoading ? `
            <div style="text-align:center;padding:60px 20px;background:#fff;border-radius:8px;border:1px solid #ede9e1; width:100%;">
              <div class="spinner" style="margin:0 auto 12px;"></div>
              <p style="font-size:12px;color:#888;font-weight:500;">Retrieving schedules...</p>
            </div>
          ` : filtered.length === 0 ? `
            <div style="text-align:center;padding:60px 20px;background:#fff;border-radius:8px;border:1px dashed #d5d0c8; width:100%;">
              <p style="font-size:14px;color:#888;">No group departures match your current filters.</p>
              <button onclick="dispatch('SET_COUNTRY_FILTER', 'All'); dispatch('SEARCH', '')" style="margin-top:10px;font-size:11px;color:var(--gold);background:none;border:none;cursor:pointer;font-weight:600;text-decoration:underline;">Reset all filters</button>
            </div>
          ` : `
            <!-- Optimized fluid Grid columns utilizing available horizontal spaces -->
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;padding-bottom:20px; width:100%;">
              ${filtered.map(pkg => `
                <div class="pkg-card" style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #ede9e1;display:flex;flex-direction:column;">
                  
                  <div class="img-wrap">
                    <img src="${esc(pkg.image)}" alt="${esc(pkg.title)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80'" />
                    ${pkg.highlight ? `<div class="highlight-strip">${esc(pkg.highlight)}</div>` : ''}
                  </div>

                  <div style="padding:16px;flex:1;display:flex;flex-direction:column;">
                    <h3 style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:700;margin:0 0 4px;color:var(--navy);">${esc(pkg.title)}</h3>
                    <p style="font-size:11px;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;color:#888;margin-bottom:14px;">${esc(pkg.duration)}</p>
                    
                    <div style="flex:1;"></div>

                    <div style="border-top:1px solid #f0ece4;padding-top:12px;display:flex;flex-direction:column;gap:8px;">
                      <a href="${esc(pkg.pdfUrl)}" target="_blank" rel="noopener noreferrer" class="btn-gold" style="width:100%;justify-content:center;text-decoration:none;padding:8px 12px;border-radius:4px;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:2px;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="12" x2="12" y2="18"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                        Itinerary PDF
                      </a>
                      
                      <button onclick="window.redirectToWhatsApp(${pkgJson(pkg)})" class="btn-whatsapp" style="width:100%;justify-content:center;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right:2px;">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Connect on WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}

        </div>
      </section>
    </main>`;
  }

  export function renderPreviewModal() {
    if (!state.previewFile) return '';
    const file = state.previewFile;
    const { icon, label } = fileIcon(file.mimeType);
    const zoom = state.previewZoom || 100;
    const isSheet = file.mimeType === 'application/vnd.google-apps.spreadsheet';

    // Sheets use htmlview (shows original formatting), everything else uses /preview
    const embedUrl = isSheet
      ? `https://docs.google.com/spreadsheets/d/${file.id}/htmlview?embedded=true&rm=minimal`
      : `https://drive.google.com/file/d/${file.id}/preview?embedded=true`;

    return `
      <div class="file-modal-overlay" onclick="if(event.target===this)closePreview()">
        <div class="file-modal">

          <div class="file-modal-header">
            <div style="display:flex;align-items:center;gap:10px;min-width:0;">
              <span style="font-size:18px;">${icon}</span>
              <div style="min-width:0;">
                <div style="font-size:13px;font-weight:700;color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:50vw;">${esc(file.name)}</div>
                <div style="font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#aaa;margin-top:1px;">${label}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
              <button onclick="dispatch('ZOOM_OUT')" style="width:30px;height:30px;border-radius:6px;border:1px solid #ede9e1;background:#faf8f4;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;color:var(--navy);" title="Zoom Out">−</button>
              <span style="font-size:11px;font-weight:600;color:#888;min-width:36px;text-align:center;">${zoom}%</span>
              <button onclick="dispatch('ZOOM_IN')" style="width:30px;height:30px;border-radius:6px;border:1px solid #ede9e1;background:#faf8f4;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;color:var(--navy);" title="Zoom In">+</button>
              <button onclick="dispatch('ZOOM_RESET')" style="height:30px;padding:0 10px;border-radius:6px;border:1px solid #ede9e1;background:#faf8f4;cursor:pointer;font-size:10px;font-weight:600;color:#888;font-family:'DM Sans',sans-serif;">Reset</button>
              <div style="width:1px;height:24px;background:#ede9e1;margin:0 4px;"></div>
              <button onclick="closePreview()"
                style="width:30px;height:30px;border-radius:6px;border:1px solid #ede9e1;background:#faf8f4;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;color:#888;"
                onmouseover="this.style.background='#fee2e2';this.style.color='#dc2626'"
                onmouseout="this.style.background='#faf8f4';this.style.color='#888'"
                title="Close">✕</button>
            </div>
          </div>

          <div class="file-modal-body" style="overflow:auto;background:#525659;position:relative;">
            <div id="file-preview-loading" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;background:#525659;z-index:2;">
              <div class="spinner" style="border-color:rgba(255,255,255,0.25);border-top-color:var(--gold);"></div>
              <p style="font-size:12px;color:rgba(255,255,255,0.7);font-weight:500;">Loading preview…</p>
            </div>
            <div style="width:${zoom}%;min-width:${zoom < 100 ? '100%' : 'auto'};margin:0 auto;">
              <iframe
                src="${embedUrl}"
                title="${esc(file.name)}"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups-to-escape-sandbox"
                style="width:100%;height:calc((100vh - 90px) * ${zoom / 100});border:none;display:block;"
                onload="const el=document.getElementById('file-preview-loading'); if(el) el.style.display='none';"
              ></iframe>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  export function renderHotels() {

    // ── When an agent is logged in: show folder file list + optional sheet table ──
    if (state.agentUnlocked) {
      const fileList = state.folderLoading ? `
        <div style="text-align:center;padding:40px;background:#fff;border-radius:8px;border:1px solid #ede9e1;">
          <div class="spinner" style="margin:0 auto 12px;"></div>
          <p style="font-size:12px;color:#888;">Loading files…</p>
        </div>
      ` : state.folderError ? `
        <div style="text-align:center;padding:40px;background:#fff;border-radius:8px;border:1px solid #fecaca;">
          <p style="font-size:13px;color:#991b1b;font-weight:600;margin:0 0 8px;">Could not load folder</p>
          <p style="font-size:12px;color:#b91c1c;margin:0;">${esc(state.folderError)}</p>
        </div>
      ` : state.folderSheets.length === 0 ? `
        <div style="text-align:center;padding:40px;background:#fff;border-radius:8px;border:1px dashed #d5d0c8;">
          <p style="font-size:14px;color:#888;">No files found in folder.</p>
        </div>
      ` : `
        <div style="background:#fff;border-radius:8px;border:1px solid #ede9e1;overflow:hidden;">
          <div style="padding:12px 18px;background:var(--slate-soft);border-bottom:1px solid #ede9e1;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
            <span style="font-size:11px;font-weight:600;color:#666;">${state.folderSheets.length} file${state.folderSheets.length === 1 ? '' : 's'} available</span>
            <div style="position:relative;flex:1;max-width:260px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);pointer-events:none;"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input id="folder-search" type="text" placeholder="Search files..." value="${esc(state.folderSearch)}"
                oninput="dispatch('FOLDER_SEARCH', this.value)"
                style="width:100%;font-family:'DM Sans',sans-serif;font-size:11px;padding:5px 8px 5px 26px;border:1px solid #ddd8ce;border-radius:6px;outline:none;color:var(--navy);background:#fff;"
                onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='#ddd8ce'"/>
            </div>
            <button onclick="refreshFolderSheets()" style="font-size:10px;font-weight:600;color:var(--gold);background:none;border:none;cursor:pointer;letter-spacing:0.05em;text-transform:uppercase;flex-shrink:0;">↻ Refresh</button>
          </div>
          ${state.folderSheets.filter(f => !state.folderSearch || f.name.toLowerCase().includes(state.folderSearch.toLowerCase())).map((file, i) => {
            const { icon, label, color } = fileIcon(file.mimeType);
            const isActive = state.activeSheetId === file.id;
            const bg = isActive ? 'background:#fffbf0;' : '';
            return '<div onclick="openPromoFile(' + i + ')" class="file-row" style="display:flex;align-items:center;gap:14px;padding:13px 18px;border-bottom:1px solid #f0ece4;cursor:pointer;' + bg + '">'
              + '<span style="font-size:20px;flex-shrink:0;">' + icon + '</span>'
              + '<div style="flex:1;min-width:0;">'
              + '<div style="font-size:13px;font-weight:' + (isActive ? '700' : '500') + ';color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(file.name) + '</div>'
              + '<div style="font-size:10px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:' + color + ';margin-top:2px;">' + label + '</div>'
              + '</div>'
              + '<span style="font-size:10px;font-weight:600;color:#aaa;letter-spacing:0.05em;text-transform:uppercase;flex-shrink:0;">Preview →</span>'
              + '</div>';
          }).join('')}
        </div>
      `;

      const sheetTable = ''; // handled by modal

      return `
      <main style="flex:1;width:100%;padding:32px 20px 80px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
          <div>
            <h2 style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:700;margin:0 0 4px;">Private Files</h2>
            <p style="font-size:12px;color:#888;margin:0;">Your exclusive access folder.</p>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--gold);background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);padding:4px 12px;border-radius:20px;">🔓 ${esc(state.agentCompanyName || state.agentUnlocked)}</span>
            <button onclick="agentLogout()" style="font-size:10px;font-weight:600;color:#aaa;background:none;border:1px solid #ddd;border-radius:20px;padding:4px 12px;cursor:pointer;font-family:'DM Sans',sans-serif;">✕ Sign Out</button>
          </div>
        </div>
        ${fileList}
        ${sheetTable}
      </main>`;
    }

    // ── Default: common sheet view — iframe embed ──
    // Append search query as a hash to scroll to matching tab if sheet has named tabs
    const sheetEmbedUrl = `https://docs.google.com/spreadsheets/d/${SHEETS_ID}/htmlview?embedded=true&rm=minimal`;

    return `
    <main style="flex:1;width:100%;padding:32px 20px 80px;">

      <!-- Header row: title + promo + search -->
      <div style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div>
          <h2 style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:700;margin:0 0 4px;">Hotel Directory</h2>
          <p style="font-size:12px;color:#888;margin:0;">Curated hotel options — live from our database.</p>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">

          <!-- Search box -->
          <div style="position:relative;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="2" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none;"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              id="hotel-search-input"
              type="text"
              placeholder="Search in sheet…"
              value="${esc(state.hotelSearch)}"
              oninput="dispatch('HOTEL_SEARCH', this.value)"
              style="font-family:'DM Sans',sans-serif;font-size:12px;padding:6px 12px 6px 30px;border:1px solid #ddd8ce;border-radius:6px;outline:none;width:180px;color:var(--navy);background:#fff;"
              onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='#ddd8ce'"/>
            ${state.hotelSearch ? `<button onclick="dispatch('HOTEL_SEARCH','')" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:14px;color:#aaa;line-height:1;">✕</button>` : ''}
          </div>

          <!-- Agent Login trigger -->
          <button onclick="dispatch('TOGGLE_AGENT_LOGIN_FORM')" class="btn-outline" style="padding:6px 14px;font-size:10px;display:flex;align-items:center;gap:6px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>
            Agent Login
          </button>
        </div>
      </div>

      <!-- Search results overlay (shown when searching) -->
      ${state.hotelSearch ? `
        <div id="hotel-search-results" style="margin-bottom:16px;background:#fff;border-radius:8px;border:1px solid #ede9e1;overflow:hidden;">
          <div style="padding:10px 16px;background:var(--slate-soft);border-bottom:1px solid #ede9e1;display:flex;align-items:center;gap:8px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <span style="font-size:11px;font-weight:600;color:#666;">Searching for "<strong>${esc(state.hotelSearch)}</strong>" in the sheet below — use Ctrl+F in the sheet to highlight matches</span>
          </div>
        </div>
      ` : ''}

      <!-- Sheet iframe -->
      <div style="background:#fff;border-radius:8px;border:1px solid #ede9e1;overflow:hidden;position:relative;">
        <div id="hotel-sheet-loading" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;background:#fff;z-index:2;">
          <div class="spinner"></div>
          <p style="font-size:12px;color:#888;font-weight:500;">Loading hotel directory…</p>
        </div>
        <iframe
          id="hotel-sheet-iframe"
          src="${sheetEmbedUrl}"
          style="width:100%;height:calc(100vh - ${state.hotelSearch ? '280' : '220'}px);min-height:500px;border:none;display:block;"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups-to-escape-sandbox"
          title="Hotel Directory"
          onload="const el=document.getElementById('hotel-sheet-loading'); if(el) el.style.display='none';"
        ></iframe>
      </div>

      ${state.hotelSearch ? `
        <div style="margin-top:10px;text-align:center;">
          <p style="font-size:11px;color:#aaa;">Tip: Click inside the sheet and press <kbd style="background:#f5f3ef;border:1px solid #ddd8ce;border-radius:3px;padding:1px 5px;font-size:10px;">Ctrl+F</kbd> to find "<strong>${esc(state.hotelSearch)}</strong>" within the sheet</p>
        </div>
      ` : ''}

    </main>`;
  }

  export function renderLogin() {
    return `
    <main style="flex:1;display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 58px);padding:24px;background:var(--navy-mid); width: 100%;">
      <div style="width:100%;max-width:360px;">
        <div style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.2);">
          
          <div style="background:var(--navy);padding:24px;text-align:center;">
            <div style="font-size:9px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:var(--gold);margin-bottom:6px;">Admin Portal</div>
            <h2 style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:700;color:#fff;margin:0;">Control Center</h2>
          </div>

          <form onsubmit="handleLogin(event)" style="padding:20px;display:flex;flex-direction:column;gap:14px;">
            ${state.loginError ? `<div class="error-box">${esc(state.loginError)}</div>` : ''}

            <div>
              <label class="field-label" for="f-user">Username</label>
              <input class="field" id="f-user" type="text" placeholder="Enter your username" autocomplete="username" />
            </div>
            <div>
              <label class="field-label" for="f-pass">Password</label>
              <input class="field" id="f-pass" type="password" placeholder="••••••••" autocomplete="current-password" />
            </div>

            <button type="submit" class="btn-gold" style="width:100%;justify-content:center;padding:10px;border-radius:4px;" ${state.loginLoading ? 'disabled style="opacity:0.7;cursor:not-allowed;"' : ''}>
              ${state.loginLoading ? 'Verifying…' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </main>`;
  }

  export function renderAdmin() {
    const isCloud = !!(isFirebaseReady && db);

    const adminBarAndNav = `
      <div class="admin-bar">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="background:rgba(201,168,76,0.15);padding:8px;border-radius:6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </div>
          <div>
            <div style="font-weight:600;font-size:13px;">Admin Dashboard</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:1px;">
              ${isCloud ? 'Live cloud synchronizing' : 'Local storage fallback active'}
            </div>
          </div>
        </div>
        <span style="font-size:8px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:4px 10px;border-radius:20px;${isCloud ? 'background:rgba(34,197,94,0.1);color:#4ade80;border:1px solid rgba(34,197,94,0.2);' : 'background:rgba(251,191,36,0.1);color:#fbbf24;border:1px solid rgba(251,191,36,0.25);'}">
          ${isCloud ? '● Synchronized' : '○ Local Database'}
        </span>
      </div>
    `;

    if (state.adminSection === 'agents') {
      return `<main style="flex: 1; width: 100%; padding:24px 20px; padding-bottom: 80px;">${adminBarAndNav}${renderAdminAgents()}</main>`;
    }

    if (state.adminSection === 'logs') {
      return `<main style="flex: 1; width: 100%; padding:24px 20px; padding-bottom: 80px;">${adminBarAndNav}${renderAdminLogs()}</main>`;
    }

    return `<main style="flex: 1; width: 100%; padding:24px 20px; padding-bottom: 80px;">${adminBarAndNav}${renderAdminPackages()}</main>`;
  }

  function renderAdminPackages() {
    const adminQuery = (state.adminSearchQuery || '').toLowerCase();

    const adminFiltered = state.packages.filter(p => {
      return !adminQuery || 
             esc(p.title).toLowerCase().includes(adminQuery) || 
             esc(p.highlight).toLowerCase().includes(adminQuery) ||
             esc(p.duration).toLowerCase().includes(adminQuery);
    });

    return `
      <div class="flex flex-col lg:flex-row gap-6 items-start">
        
        <!-- Sticky Form Panel -->
        <div class="lg:sticky lg:top-[74px] w-full lg:max-w-[320px] flex-shrink-0" style="background:#fff;border-radius:8px;border:1px solid #ede9e1;padding:18px;">
          <div style="margin-bottom:14px;">
            <span style="font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background:#f5f3ef;color:#666;padding:3px 8px;border-radius:3px;">
              ${state.editingId ? 'Edit Draft' : 'Add Departure'}
            </span>
            <h3 style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:700;margin:6px 0 0;">
              ${state.editingId ? 'Edit Package Specs' : 'Publish New Destination'}
            </h3>
          </div>

          ${state.formError ? `<div class="error-box" style="margin-bottom:12px;">${esc(state.formError)}</div>` : ''}
          ${state.formSuccess ? `<div class="success-box" style="margin-bottom:12px;">${esc(state.formSuccess)}</div>` : ''}

          <form onsubmit="handlePackageSubmit(event)" style="display:flex;flex-direction:column;gap:12px;">
            <div>
              <label class="field-label" for="f-title">Destination Country *</label>
              <input class="field" id="f-title" type="text" placeholder="e.g. Switzerland" value="${esc(state.draft.title)}" required />
            </div>
            <div>
              <label class="field-label" for="f-duration">Duration Description *</label>
              <input class="field" id="f-duration" type="text" placeholder="e.g. 3 Nights / 4 Days" value="${esc(state.draft.duration)}" required />
            </div>
            <div>
              <label class="field-label" for="f-highlight">Highlight Summary</label>
              <input class="field" id="f-highlight" type="text" placeholder="e.g. Zurich 3N" value="${esc(state.draft.highlight)}" />
            </div>
            <div>
              <label class="field-label" for="f-image">Card Image URL</label>
              <input class="field" id="f-image" type="url" placeholder="https://unsplash..." value="${esc(state.draft.image)}" />
            </div>
            <div style="background:#faf8f4;border:1px solid #ede9e1;border-radius:6px;padding:10px;">
              <label class="field-label" for="f-pdf">Itinerary Link (PDF) *</label>
              <input class="field" id="f-pdf" type="url" placeholder="https://..." value="${esc(state.draft.pdfUrl)}" required />
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;padding-top:2px;">
              <button type="submit" class="btn-gold" style="width:100%;justify-content:center;padding:9px;border-radius:4px;">
                ${state.editingId ? 'Save Specs' : 'Publish Departure'}
              </button>
              ${state.editingId ? `
                <button type="button" class="btn-outline" onclick="handleCancelEdit()" style="width:100%;justify-content:center;padding:8px;">
                  Cancel
                </button>
              ` : ''}
            </div>
          </form>
        </div>

        <!-- Directory Panel stretching fluidly to use maximum widescreen space -->
        <div style="flex:1;display:flex;flex-direction:column;gap:20px;width:100%;">
          
          <div style="background:#fff;border-radius:8px;border:1px solid #ede9e1;overflow:hidden;">
            <div style="padding:14px 18px;border-bottom:1px solid #ede9e1;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
              <div>
                <h3 style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:700;margin:0;">Active Departures Directory</h3>
                <span style="font-size:11px;color:#888;font-weight:500;">
                  ${adminFiltered.length} of ${state.packages.length} listed
                </span>
              </div>
            </div>

            ${state.isDbLoading ? `
              <div style="text-align:center;padding:36px;text-align:center;">
                <div class="spinner" style="margin:0 auto 10px;"></div>
                <p style="font-size:12px;color:#888;">Contacting database...</p>
              </div>
            ` : adminFiltered.length === 0 ? `
              <p style="padding:24px;font-size:13px;color:#999;text-align:center;">
                ${state.packages.length === 0 ? 'Directory empty. Create catalog entries using the panel on the left.' : 'No departures match your search query.'}
              </p>
            ` : `
              <div style="overflow-x:auto; width:100%;">
                <table style="width:100%;">
                  <thead>
                    <tr>
                      <th style="text-align:left;width:45px;padding:10px 12px;">#</th>
                      <th style="text-align:left;">Destination Info</th>
                      <th style="text-align:left;">Duration</th>
                      <th style="text-align:left;">Focus Highlights</th>
                      <th style="text-align:right;">Operations</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${adminFiltered.map((pkg, index) => `
                      <tr class="${state.editingId === pkg.id ? 'editing-row' : ''}">
                        <td style="font-weight:600;color:var(--gold);width:45px;padding:10px 12px;">${index + 1}</td>
                        <td>
                          <div style="display:flex;align-items:center;gap:10px;">
                            <img src="${esc(pkg.image)}" style="width:34px;height:34px;border-radius:4px;object-fit:cover;background:#e8e4dc;flex-shrink:0;" onerror="this.style.background='#e8e4dc';this.style.visibility='hidden'" />
                            <div>
                              <div style="font-weight:600;font-size:12px;color:var(--navy);">${esc(pkg.title)}</div>
                              <a href="${esc(pkg.pdfUrl)}" target="_blank" style="font-size:10px;color:var(--gold);text-decoration:none;font-weight:500;">Itinerary Link ↗</a>
                            </div>
                          </div>
                        </td>
                        <td style="color:#555;font-size:12px;white-space:nowrap;">${esc(pkg.duration)}</td>
                        <td>
                          ${pkg.highlight ? `<span style="font-size:9px;font-weight:600;letter-spacing:0.04em;background:#f5f3ef;border:1px solid #ded9cf;color:var(--navy);padding:2px 8px;border-radius:4px;">${esc(pkg.highlight)}</span>` : '<span style="color:#ccc;font-size:11px;">—</span>'}
                        </td>
                        <td style="text-align:right;padding:10px 12px;">
                          <div style="display:flex;justify-content:flex-end;gap:4px;">
                            <button class="btn-edit" style="padding:4px 8px;font-size:10px;" onclick="handleStartEdit('${esc(pkg.id)}')">Edit</button>
                            <button class="btn-danger" style="padding:4px 8px;font-size:10px;" onclick="triggerDeleteConfirmation('${esc(pkg.id)}')">Delete</button>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>

        </div>
      </div>
    `;
  }

  function renderAdminAgents() {
    const q = (state.agentSearchQuery || '').toLowerCase();
    const filtered = state.agents.filter(a => !q || (a.companyName || '').toLowerCase().includes(q) || (a.agentCode || '').toLowerCase().includes(q));

    return `
      <div class="flex flex-col lg:flex-row gap-6 items-start">

        <!-- Sticky Form Panel -->
        <div class="lg:sticky lg:top-[74px] w-full lg:max-w-[320px] flex-shrink-0" style="background:#fff;border-radius:8px;border:1px solid #ede9e1;padding:18px;">
          <div style="margin-bottom:14px;">
            <span style="font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background:#f5f3ef;color:#666;padding:3px 8px;border-radius:3px;">
              ${state.editingAgentId ? 'Edit Access' : 'Grant Access'}
            </span>
            <h3 style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:700;margin:6px 0 0;">
              ${state.editingAgentId ? 'Edit Agent Access' : 'Add Agent Access'}
            </h3>
            <p style="font-size:11px;color:#888;margin:6px 0 0;line-height:1.5;">
              Agents sign in with an Agent Code + Password that you set here — share both with them yourself (WhatsApp, email, etc.).
            </p>
          </div>

          ${state.agentFormError ? `<div class="error-box" style="margin-bottom:12px;">${esc(state.agentFormError)}</div>` : ''}
          ${state.agentFormSuccess ? `<div class="success-box" style="margin-bottom:12px;">${esc(state.agentFormSuccess)}</div>` : ''}

          <form onsubmit="handleAgentSubmit(event)" style="display:flex;flex-direction:column;gap:12px;">
            <div>
              <label class="field-label" for="f-agt-company">Company Name *</label>
              <input class="field" id="f-agt-company" type="text" placeholder="e.g. Blue Horizon Travel" value="${esc(state.agentDraft.companyName)}" required />
            </div>
            <div>
              <label class="field-label" for="f-agt-agentcode">Agent Code *</label>
              <input class="field" id="f-agt-agentcode" type="text" placeholder="e.g. RT-BLUEHORIZON" value="${esc(state.agentDraft.agentCode)}" required />
            </div>
            <div>
              <label class="field-label" for="f-agt-password">Password *</label>
              <input class="field" id="f-agt-password" type="text" placeholder="Set a password for this agent" value="${esc(state.agentDraft.password)}" required />
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;padding-top:2px;">
              <button type="submit" class="btn-gold" style="width:100%;justify-content:center;padding:9px;border-radius:4px;">
                ${state.editingAgentId ? 'Save Changes' : 'Grant Access'}
              </button>
              ${state.editingAgentId ? `
                <button type="button" class="btn-outline" onclick="handleAgentCancelEdit()" style="width:100%;justify-content:center;padding:8px;">
                  Cancel
                </button>
              ` : ''}
            </div>
          </form>
        </div>

        <!-- Access List Directory -->
        <div style="flex:1;display:flex;flex-direction:column;gap:20px;width:100%;">

          <div style="background:#fff;border-radius:8px;border:1px solid #ede9e1;overflow:hidden;">
            <div style="padding:14px 18px;border-bottom:1px solid #ede9e1;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
              <div>
                <h3 style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:700;margin:0;">Agent Access List</h3>
                <span style="font-size:11px;color:#888;font-weight:500;">
                  ${filtered.length} of ${state.agents.length} agents
                </span>
              </div>
            </div>

            ${!state.agentsLoaded ? `
              <div style="text-align:center;padding:36px;">
                <div class="spinner" style="margin:0 auto 10px;"></div>
                <p style="font-size:12px;color:#888;">Loading access list...</p>
              </div>
            ` : filtered.length === 0 ? `
              <p style="padding:24px;font-size:13px;color:#999;text-align:center;">
                ${state.agents.length === 0 ? 'No agents yet. Grant access using the panel on the left.' : 'No agents match your search query.'}
              </p>
            ` : `
              <div style="overflow-x:auto; width:100%;">
                <table style="width:100%;">
                  <thead>
                    <tr>
                      <th style="text-align:left;width:45px;padding:10px 12px;">#</th>
                      <th style="text-align:left;">Company</th>
                      <th style="text-align:left;">Agent Code</th>
                      <th style="text-align:left;">Password</th>
                      <th style="text-align:right;">Operations</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filtered.map((agent, index) => `
                      <tr class="${state.editingAgentId === agent.id ? 'editing-row' : ''}">
                        <td style="font-weight:600;color:var(--gold);width:45px;padding:10px 12px;">${index + 1}</td>
                        <td style="font-weight:600;font-size:12px;color:var(--navy);">${esc(agent.companyName)}</td>
                        <td style="font-size:12px;color:#555;font-family:monospace;letter-spacing:0.03em;">${esc(agent.agentCode)}</td>
                        <td style="font-size:12px;color:#555;font-family:monospace;letter-spacing:0.03em;">${esc(agent.password)}</td>
                        <td style="text-align:right;padding:10px 12px;">
                          <div style="display:flex;justify-content:flex-end;gap:4px;">
                            <button class="btn-edit" style="padding:4px 8px;font-size:10px;" onclick="handleAgentStartEdit('${esc(agent.id)}')">Edit</button>
                            <button class="btn-danger" style="padding:4px 8px;font-size:10px;" onclick="triggerAgentDeleteConfirmation('${esc(agent.id)}')">Delete</button>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>

        </div>
      </div>
    `;
  }

  function renderAdminLogs() {
    const q = (state.adminLogSearchQuery || '').toLowerCase();
    const fromDate = state.adminLogDateFrom ? new Date(state.adminLogDateFrom + 'T00:00:00') : null;
    const toDate = state.adminLogDateTo ? new Date(state.adminLogDateTo + 'T23:59:59') : null;

    const filtered = state.agentLogs.filter(l => {
      const matchesSearch = !q || (l.companyName || '').toLowerCase().includes(q) || (l.agentCode || '').toLowerCase().includes(q) || (l.location || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;

      const loggedAt = new Date(l.loggedAt || 0);
      if (fromDate && loggedAt < fromDate) return false;
      if (toDate && loggedAt > toDate) return false;
      return true;
    });

    function formatTimestamp(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    }

    return `
      <div style="background:#fff;border-radius:8px;border:1px solid #ede9e1;overflow:hidden;">
        <div style="padding:14px 18px;border-bottom:1px solid #ede9e1;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <h3 style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:700;margin:0;">Agent Login Logs</h3>
            <span style="font-size:11px;color:#888;font-weight:500;">
              ${filtered.length} of ${state.agentLogs.length} logins recorded · logs older than 30 days are removed automatically
            </span>
          </div>

          ${state.agentLogs.length > 0 ? `
            <button class="btn-danger" style="padding:6px 12px;font-size:10px;" onclick="triggerClearLogsConfirmation()">Clear All</button>
          ` : ''}
        </div>

        ${!state.agentLogsLoaded ? `
          <div style="text-align:center;padding:36px;">
            <div class="spinner" style="margin:0 auto 10px;"></div>
            <p style="font-size:12px;color:#888;">Loading login logs...</p>
          </div>
        ` : filtered.length === 0 ? `
          <p style="padding:24px;font-size:13px;color:#999;text-align:center;">
            ${state.agentLogs.length === 0 ? 'No agent logins recorded yet.' : 'No logins match your search query.'}
          </p>
        ` : `
          <div style="overflow-x:auto; width:100%;">
            <table style="width:100%;">
              <thead>
                <tr>
                  <th style="text-align:left;width:45px;padding:10px 12px;">#</th>
                  <th style="text-align:left;">Company</th>
                  <th style="text-align:left;">Agent Code</th>
                  <th style="text-align:left;">Location</th>
                  <th style="text-align:left;">Signed In At</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map((log, index) => `
                  <tr>
                    <td style="font-weight:600;color:var(--gold);width:45px;padding:10px 12px;">${index + 1}</td>
                    <td style="font-weight:600;font-size:12px;color:var(--navy);">${esc(log.companyName)}</td>
                    <td style="font-size:12px;color:#555;font-family:monospace;letter-spacing:0.03em;">${esc(log.agentCode)}</td>
                    <td style="font-size:12px;color:#555;">${esc(log.location || 'Unknown')}</td>
                    <td style="font-size:12px;color:#555;">${formatTimestamp(log.loggedAt)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  }

  export function renderDeleteConfirmationModal() {
    const target = state.deleteTarget;
    const isAgent = target.type === 'agent';
    const isLogsAll = target.type === 'logs-all';

    let itemLabel = 'this item';
    let bodyText = 'This action instantly removes the item.';
    let headerTitle = 'Delete Specs';

    if (isLogsAll) {
      itemLabel = 'all login logs';
      bodyText = 'This permanently deletes every recorded agent login. This cannot be undone.';
      headerTitle = 'Clear Logs';
    } else if (isAgent) {
      const agent = state.agents.find(a => a.id === target.id);
      itemLabel = agent ? agent.companyName : 'this agent';
      bodyText = 'This immediately revokes hotel access for this agent.';
      headerTitle = 'Revoke Access';
    } else {
      const pkg = state.packages.find(p => p.id === target.id);
      itemLabel = pkg ? pkg.title : 'this departure';
      bodyText = 'This action instantly removes the package from customer schedules.';
      headerTitle = 'Delete Specs';
    }

    return `
    <div class="modal-backdrop" onclick="if(event.target===this)window.cancelDelete()">
      <div class="modal-box" style="background:#fff;width:100%;max-width:350px;border-radius:8px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.3);">
        
        <div style="background:#991b1b;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;">
          <h3 style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:700;color:#fff;margin:0;">${headerTitle}</h3>
          <button onclick="window.cancelDelete()" style="background:rgba(255,255,255,0.12);border:none;color:#fff;width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;">✕</button>
        </div>

        <div style="padding:24px 20px;text-align:center;">
          <div style="width:40px;height:40px;background:#fff1f2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <p style="font-size:13px;color:#0a1628;margin:0 0 6px;font-weight:600;">
            Confirm removal of <span style="color:var(--gold);font-family:'Cormorant Garamond',serif;font-size:16px;">${esc(itemLabel)}</span>?
          </p>
          <p style="font-size:11px;color:#666;line-height:1.5;margin:0 0 18px;">
            ${bodyText}
          </p>
          <div style="display:flex;gap:8px;">
            <button class="btn-outline" onclick="window.cancelDelete()" style="flex:1;padding:8px;">Cancel</button>
            <button class="btn-gold" onclick="window.confirmDelete()" style="flex:1;background:#dc2626;color:#fff;border:none;justify-content:center;padding:8px;">Confirm</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  // ── AGENT LOGIN MODAL ─────────────────────────────────────────────────────
  export function renderAgentLoginModal() {
    return `
    <div class="modal-backdrop" onclick="if(event.target===this)dispatch('TOGGLE_AGENT_LOGIN_FORM')">
      <div class="modal-box" style="background:#fff;width:100%;max-width:360px;border-radius:8px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.3);">

        <div style="background:var(--navy);padding:16px 20px;display:flex;justify-content:space-between;align-items:center;">
          <h3 style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:700;color:#fff;margin:0;">Agent Access</h3>
          <button onclick="dispatch('TOGGLE_AGENT_LOGIN_FORM')" style="background:rgba(255,255,255,0.12);border:none;color:#fff;width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;">✕</button>
        </div>

        <div style="padding:20px;">
          <p style="font-size:11px;color:#888;margin:0 0 14px;">Enter the agent code and password shared with you.</p>

          ${state.agentLoginError ? `<div class="error-box" style="margin-bottom:12px;">${esc(state.agentLoginError)}</div>` : ''}

          <div style="display:flex;flex-direction:column;gap:10px;">
            <div>
              <label class="field-label" for="agent-code-input">Agent Code</label>
              <input class="field" id="agent-code-input" type="text" placeholder="e.g. BLUEHORIZON-01" autofocus
                onkeydown="if(event.key==='Enter')handleAgentLogin()"/>
            </div>
            <div>
              <label class="field-label" for="agent-password-input">Password</label>
              <input class="field" id="agent-password-input" type="password" placeholder="Enter your password"
                onkeydown="if(event.key==='Enter')handleAgentLogin()"/>
            </div>
            <button onclick="handleAgentLogin()" class="btn-gold" style="width:100%;justify-content:center;padding:9px;margin-top:2px;" ${state.agentLoginLoading ? 'disabled style="opacity:0.7;cursor:not-allowed;"' : ''}>
              ${state.agentLoginLoading ? 'Checking…' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>`;
  }
