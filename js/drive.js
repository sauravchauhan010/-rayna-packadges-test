import { state } from './state.js';
import { render } from './render.js';

export async function fetchFolderSheets() {
  if (state.folderFetched) return;
  state.folderLoading = true;
  state.folderError = '';
  render();
  try {
    const res = await fetch('/api/drive-folder', { cache: 'no-store' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `Drive API error ${res.status}`);
    }
    const json = await res.json();
    state.folderSheets = (json.files || []).sort((a, b) => a.name.localeCompare(b.name));
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

window.openPromoFile = (index) => {
  const file = state.folderSheets[index];
  if (!file) return;
  state.previewFile = file;
  state.previewOpenedAt = Date.now();
  state.activeSheetId = file.id;
  render();
};

window.refreshFolderSheets = () => {
  state.folderFetched = false;
  state.activeSheetId = null;
  fetchFolderSheets();
};

window.closePreview = () => {
  state.previewFile = null;
  state.previewZoom = 100;
  state.activeSheetId = null;
  render();
};

window.redirectToWhatsApp = (pkg) => {
  const phoneNumber = "971556232958";
  const textMessage = `Hello Rayna Tours, I'm interested in booking the following Premium Departure package:

📍 Destination: ${pkg.title}
⏳ Duration: ${pkg.duration}
✨ Highlights: ${pkg.highlight || 'Detailed Itinerary Included'}
📄 Itinerary Details: ${pkg.pdfUrl}

Please let me know the booking procedures and upcoming departures. Thank you!`;

  const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(textMessage)}`;
  window.open(waUrl, '_blank');
};
