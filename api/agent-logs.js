// /api/agent-logs
// GET    -> list agent login logs (admin only)
// DELETE -> clear all logs (admin only)

import { getDb, logsCollection } from './_lib/firebaseAdmin.js';
import { requireAdmin } from './_lib/session.js';

export default async function handler(req, res) {
  if (!requireAdmin(req)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const db = await getDb();
  const col = logsCollection(db);

  try {
    if (req.method === 'GET') {
      const snap = await col.get();
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.loggedAt || 0) - new Date(a.loggedAt || 0));
      return res.status(200).json({ logs: list });
    }

    if (req.method === 'DELETE') {
      const snap = await col.get();
      await Promise.all(snap.docs.map(d => d.ref.delete()));
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', 'GET, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Agent logs API error:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
