// POST /api/login
// Body: { username, password }
// Response: { success: true } or { error: '...' }
//
// NOTE: If you already have a working api/login.js deployed on Vercel with
// your real admin-auth logic, keep using that one instead of this template —
// this file only exists so the project structure is complete. It checks
// credentials against environment variables so nothing sensitive lives in
// the code itself.
//
// Set these in Vercel → Project → Settings → Environment Variables:
//   ADMIN_USERNAME
//   ADMIN_PASSWORD
//   ADMIN_SESSION_SECRET   (long random string — see api/_lib/session.js)
//
// On success this sets an HttpOnly, signed session cookie. The old version
// just told the browser "you're logged in" and trusted the browser to
// remember that honestly — which anyone could fake from DevTools. Now the
// server issues a cookie the browser can't forge, and every admin API route
// checks it.

import { setAdminSession } from './_lib/session.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body || {};

  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass || !process.env.ADMIN_SESSION_SECRET) {
    console.error('ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_SESSION_SECRET are not set in environment variables.');
    return res.status(500).json({ error: 'Admin login is not configured on the server.' });
  }

  if (username === expectedUser && password === expectedPass) {
    setAdminSession(res);
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ error: 'Incorrect username or password. Please try again.' });
}
