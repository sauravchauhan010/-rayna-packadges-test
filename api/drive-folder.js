// GET /api/drive-folder?folderId=<optional>
// Response: { files: [{ id, name, mimeType, webViewLink }, ...] }
//
// This replaces the old client-side call to the Google Drive API, which
// exposed your API key to anyone viewing page source. The key now lives
// only in this server-side function.
//
// `folderId` is optional — omit it (or don't pass the param) to list the
// root folder. Pass it to list the contents of any subfolder the agent has
// navigated into on the client (folders come back in the same `files`
// array, distinguished by mimeType 'application/vnd.google-apps.folder').
//
// Set these in Vercel → Project → Settings → Environment Variables:
//   GOOGLE_API_KEY     (a Google Cloud API key with the Drive API enabled)
//   DRIVE_FOLDER_ID     (optional override — defaults to the folder ID below)

import { getAgentSession } from './_lib/session.js';

const DEFAULT_DRIVE_FOLDER_ID = '1mB1pOWQMtNgP06NeDXzjjBSx6MRCiccG';

// Drive file/folder IDs are always alphanumeric plus - and _. Anything else
// coming in on the query string is rejected rather than interpolated as-is.
const VALID_ID = /^[a-zA-Z0-9_-]+$/;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // This is agent-only content — require the signed agent session cookie
  // set by /api/agent-login, rather than trusting whatever the client's
  // localStorage flag says.
  if (!getAgentSession(req)) {
    return res.status(401).json({ error: 'Please sign in as an agent to view this folder.' });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  const rootFolderId = process.env.DRIVE_FOLDER_ID || DEFAULT_DRIVE_FOLDER_ID;

  const requestedFolderId = Array.isArray(req.query.folderId) ? req.query.folderId[0] : req.query.folderId;
  let folderId = rootFolderId;
  if (requestedFolderId) {
    if (!VALID_ID.test(requestedFolderId)) {
      return res.status(400).json({ error: 'Invalid folder id.' });
    }
    folderId = requestedFolderId;
  }

  if (!apiKey) {
    console.error('GOOGLE_API_KEY is not set in environment variables.');
    return res.status(500).json({ error: 'Drive access is not configured on the server.' });
  }

  try {
    const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,webViewLink)&key=${apiKey}`;
    const driveRes = await fetch(url);
    const json = await driveRes.json();

    if (!driveRes.ok) {
      const message = json?.error?.message || `Drive API error ${driveRes.status}`;
      return res.status(driveRes.status).json({ error: message });
    }

    return res.status(200).json({ files: json.files || [] });
  } catch (err) {
    console.error('Drive folder proxy error:', err);
    return res.status(500).json({ error: 'Could not reach Google Drive.' });
  }
}
