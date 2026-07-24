// GET /api/config
// Response: { sheetsId: '...' }
//
// Lets the Sheets ID be set per-deployment via a Vercel environment
// variable (SHEETS_ID) instead of a code edit — same idea as
// DRIVE_FOLDER_ID already works for api/drive-folder.js.
//
// This is intentionally public / unauthenticated: a Google Sheet ID isn't
// sensitive on its own (it only matters combined with the sheet's own
// sharing permissions, which is a separate concern), so there's no session
// check here, unlike the agent/admin routes.
//
// Set this in Vercel → Project → Settings → Environment Variables:
//   SHEETS_ID   (optional — falls back to the hardcoded default below if unset)

const DEFAULT_SHEETS_ID = '1DqDfJb6My3mPMlArN02czNR7LlEv1I_iwW5NiIb4aiM';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    sheetsId: process.env.SHEETS_ID || DEFAULT_SHEETS_ID
  });
}
