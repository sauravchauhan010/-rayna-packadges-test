// /api/agents
// GET    -> list agents (admin only), passwords stripped out entirely
// POST   -> create an agent (admin only), password is hashed before storage
// PUT    -> update an agent (admin only, body: { id, companyName, agentCode, password? })
//           password is optional on update — omit it to keep the current one
// DELETE -> remove an agent (admin only, body: { id })
//
// Every method requires a valid admin session cookie (see api/_lib/session.js).
// This is what replaces the old client-side Firestore listener that loaded
// every agent's plaintext password into any visitor's browser.

import bcrypt from 'bcryptjs';
import { getDb, agentsCollection, getFieldValue } from './_lib/firebaseAdmin.js';
import { requireAdmin } from './_lib/session.js';

export default async function handler(req, res) {
  if (!requireAdmin(req)) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const db = await getDb();
  const col = agentsCollection(db);

  try {
    if (req.method === 'GET') {
      const snap = await col.get();
      const list = snap.docs.map(d => {
        const data = d.data();
        // Never send password/passwordHash to the client, even to the admin UI.
        const { password, passwordHash, ...safe } = data;
        return { id: d.id, ...safe, hasPassword: !!(password || passwordHash) };
      });
      list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      return res.status(200).json({ agents: list });
    }

    if (req.method === 'POST') {
      const { companyName, agentCode, password } = req.body || {};
      if (!companyName || !agentCode || !password) {
        return res.status(400).json({ error: 'Company name, agent code, and password are all required.' });
      }

      const dup = await col.where('agentCode', '==', agentCode).limit(1).get();
      if (!dup.empty) {
        return res.status(409).json({ error: `Agent code "${agentCode}" is already in use.` });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const ref = await col.add({
        companyName,
        agentCode,
        passwordHash,
        createdAt: new Date().toISOString()
      });
      return res.status(200).json({ success: true, id: ref.id });
    }

    if (req.method === 'PUT') {
      const { id, companyName, agentCode, password } = req.body || {};
      if (!id || !companyName || !agentCode) {
        return res.status(400).json({ error: 'Id, company name, and agent code are required.' });
      }

      const dup = await col.where('agentCode', '==', agentCode).get();
      if (dup.docs.some(d => d.id !== id)) {
        return res.status(409).json({ error: `Agent code "${agentCode}" is already in use.` });
      }

      const update = { companyName, agentCode };
      if (password) {
        update.passwordHash = await bcrypt.hash(password, 10);
        const FieldValue = await getFieldValue();
        update.password = FieldValue.delete(); // clear any legacy plaintext field
      }
      await col.doc(id).update(update);
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Id is required.' });
      await col.doc(id).delete();
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Agents API error:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
