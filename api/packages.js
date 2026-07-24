// /api/packages
// POST   -> create a package (admin only)
// PUT    -> update a package (admin only, body: { id, title, duration, highlight, image, pdfUrl })
// DELETE -> remove a package (admin only, body: { id })
//
// Reads still happen client-side via the live Firestore listener in
// js/db-packages.js — Firestore rules allow public read on packages, so
// that stays untouched. Only writes move here, so Firestore rules can
// safely deny all direct client writes (`allow write: if false`) without
// breaking the admin dashboard.
//
// Every method requires a valid admin session cookie (see api/_lib/session.js).

import { getDb, packagesCollection } from './_lib/firebaseAdmin.js';
import { requireAdmin } from './_lib/session.js';

export default async function handler(req, res) {
  if (!requireAdmin(req)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const db = await getDb();
  const col = packagesCollection(db);

  try {
    if (req.method === 'POST') {
      const { title, duration, highlight, image, pdfUrl } = req.body || {};
      if (!title || !duration || !pdfUrl) {
        return res.status(400).json({ error: 'Country title, duration, and PDF link are required.' });
      }

      const ref = await col.add({
        title: title.trim(),
        duration: duration.trim(),
        highlight: highlight || '',
        image: image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80',
        pdfUrl,
        createdAt: new Date().toISOString()
      });
      return res.status(200).json({ success: true, id: ref.id });
    }

    if (req.method === 'PUT') {
      const { id, title, duration, highlight, image, pdfUrl } = req.body || {};
      if (!id || !title || !duration || !pdfUrl) {
        return res.status(400).json({ error: 'Id, country title, duration, and PDF link are required.' });
      }

      await col.doc(id).update({
        title: title.trim(),
        duration: duration.trim(),
        highlight: highlight || '',
        image: image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80',
        pdfUrl
      });
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Id is required.' });
      await col.doc(id).delete();
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', 'POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Packages API error:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
