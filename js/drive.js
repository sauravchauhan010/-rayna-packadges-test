import { state } from './state.js';
import { render } from './render.js';

const FOLDER_MIME = 'application/vnd.google-apps.folder';

// Fetches the common Hotel Directory sheet's raw cell data via Google's
// public gviz JSON feed (works for any sheet shared "anyone with the link
// can view" — the same access level the htmlview embed already relies on).
// Cached once in state so repeated keystrokes in the search box don't
// re-fetch; only runs the first time a search is made.
export async function fetchHotelSheetData() {
  if (state.hotelSheetDataLoading || state.hotelSheetDataLoaded) return;
  state.hotelSheetDataLoading = true;
  state.hotelSheetDataError = '';
  render();
  try {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${state.sheetsId}/gviz/tq?tqx=out:json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Sheet data error ${res.status}`);
    const text = await res.text();
    const jsonStart = text.indexOf('(');
    const jsonEnd = text.lastIndexOf(')');
    const json = JSON.parse(text.substring(jsonStart + 1, jsonEnd));
    const cols = (json.table.cols || []).map((c, i) => c.label || c.id || `Col ${i + 1}`);
    const rows = (json.table.rows || []).map(r =>
      (r.c || []).map(cell => {
        if (!cell) return '';
        const v = cell.f ?? cell.v;
        return v == null ? '' : String(v);
      })
    );
    state.hotelSheetCols = cols;
    state.hotelSheetRows = rows;
    state.hotelSheetDataLoaded = true;
  } catch (err) {
    console.error('Hotel sheet data fetch error:', err);
    state.hotelSheetDataError = 'Live search unavailable right now — use Ctrl+F in the sheet below instead.';
  }
  state.hotelSheetDataLoading = false;
  render();
}

// Fetches the contents of a single Drive folder. `folderId` of null/undefined
// means "root" — the server falls back to DRIVE_FOLDER_ID in that case.
export async function fetchFolderSheets(folderId = null) {
  state.folderLoading = true;
  state.folderError = '';
  state.folderSearch = '';
  render();
  try {
    const url = folderId ? `/api/drive-folder?folderId=${encodeURIComponent(folderId)}` : '/api/drive-folder';
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `Drive API error ${res.status}`);
    }
    const json = await res.json();
    // Folders first, then files — both groups alphabetical. Mirrors how a
    // local file explorer sorts a directory listing.
    state.folderSheets = (json.files || []).sort((a, b) => {
      const aFolder = a.mimeType === FOLDER_MIME;
      const bFolder = b.mimeType === FOLDER_MIME;
      if (aFolder !== bFolder) return aFolder ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    state.folderFetched = true;
    state.activeSheetId = null;
    state.activeSheetName = '';
  } catch (err) {
    console.error('Drive folder fetch error:', err);
    state.folderError = 'Could not load folder: ' + err.message;
  }
  state.folderLoading = false;
  render();
}

// Clicking a row: folders drill in (pushed onto the breadcrumb stack and
// re-fetched), files open the preview modal — same as before.
window.openPromoFile = (fileId) => {
  const file = state.folderSheets.find(f => f.id === fileId);
  if (!file) return;

  if (file.mimeType === FOLDER_MIME) {
    state.folderStack.push({ id: file.id, name: file.name });
    fetchFolderSheets(file.id);
    return;
  }

  state.previewFile = file;
  state.previewOpenedAt = Date.now();
  state.activeSheetId = file.id;
  render();
};

// Breadcrumb click: jump back to any earlier folder in the trail, dropping
// everything after it (just like clicking a path segment in a file explorer).
window.navigateFolderCrumb = (index) => {
  if (index >= state.folderStack.length - 1) return; // already there
  state.folderStack = state.folderStack.slice(0, index + 1);
  const target = state.folderStack[state.folderStack.length - 1];
  fetchFolderSheets(target.id);
};

// One level up.
window.navigateFolderUp = () => {
  if (state.folderStack.length <= 1) return;
  window.navigateFolderCrumb(state.folderStack.length - 2);
};

window.refreshFolderSheets = () => {
  const current = state.folderStack[state.folderStack.length - 1];
  state.activeSheetId = null;
  fetchFolderSheets(current.id);
};

window.closePreview = () => {
  state.previewFile = null;
  state.previewZoom = 100;
  state.activeSheetId = null;
  render();
};

window.redirectToWhatsApp = (pkg) => {
  const phoneNumber = "971556232958";
  const textMessage = `Hello, I'm interested in booking the following Premium Departure package:

📍 Destination: ${pkg.title}
⏳ Duration: ${pkg.duration}
✨ Highlights: ${pkg.highlight || 'Detailed Itinerary Included'}
📄 Itinerary Details: ${pkg.pdfUrl}

Please let me know the booking procedures and upcoming departures. Thank you!`;

  const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(textMessage)}`;
  window.open(waUrl, '_blank');
};
