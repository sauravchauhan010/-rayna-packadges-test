// POST /api/logout — clears the admin session cookie.

import { clearAdminSession } from './_lib/session.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  clearAdminSession(res);
  return res.status(200).json({ success: true });
}
