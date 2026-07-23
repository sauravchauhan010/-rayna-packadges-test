// GET /api/session-check — the client calls this on page load (when
// ?admin is in the URL) to find out whether it holds a *valid, server-signed*
// admin session, instead of trusting a sessionStorage flag it could have
// set itself.

import { requireAdmin } from './_lib/session.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  return res.status(200).json({ loggedIn: requireAdmin(req) });
}
