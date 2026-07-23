// POST /api/agent-login
// Body: { agentCode, password }
// Response: { success: true, companyName } or { error: '...' }
//
// This used to be a client-side check against a full agents list (including
// plaintext passwords) that was loaded into every visitor's browser via a
// live Firestore listener. Now: the browser never sees the agents list at
// all, passwords are hashed (bcrypt) not plaintext, and the comparison
// happens only here, server-side.

import bcrypt from 'bcryptjs';
import { getDb, agentsCollection, getFieldValue } from './_lib/firebaseAdmin.js';
import { setAgentSession } from './_lib/session.js';
import { recordAgentLoginServer } from './_lib/logs.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agentCode, password } = req.body || {};
  if (!agentCode || !password) {
    return res.status(400).json({ error: 'Agent code and password are required.' });
  }

  if (!process.env.AGENT_SESSION_SECRET) {
    console.error('AGENT_SESSION_SECRET is not set in environment variables.');
    return res.status(500).json({ error: 'Agent login is not configured on the server.' });
  }

  try {
    const db = await getDb();
    const snap = await agentsCollection(db).where('agentCode', '==', agentCode).limit(1).get();

    if (snap.empty) {
      return res.status(401).json({ error: 'This agent code is not recognized. Please contact the admin team for access.' });
    }

    const agent = snap.docs[0].data();
    const hash = agent.passwordHash;

    // Support agents created before this migration (plaintext `password`
    // field) by checking that once, then upgrading them to a hash so the
    // plaintext never needs to be read again.
    let ok = false;
    if (hash) {
      ok = await bcrypt.compare(password, hash);
    } else if (agent.password) {
      ok = agent.password === password;
      if (ok) {
        const newHash = await bcrypt.hash(password, 10);
        const FieldValue = await getFieldValue();
        await snap.docs[0].ref.update({ passwordHash: newHash, password: FieldValue.delete() });
      }
    }

    if (!ok) {
      return res.status(401).json({ error: 'Incorrect password. Please check and try again.' });
    }

    const companyName = agent.companyName || '';

    // Server-trusted geolocation (Vercel edge headers) instead of trusting
    // whatever the client claims.
    const city = req.headers['x-vercel-ip-city'];
    const region = req.headers['x-vercel-ip-country-region'];
    const country = req.headers['x-vercel-ip-country'];
    const cityDecoded = city ? decodeURIComponent(city) : '';
    let location = 'Unknown';
    if (cityDecoded && country) location = `${cityDecoded}, ${country}`;
    else if (region && country) location = `${region}, ${country}`;
    else if (country) location = country;

    await recordAgentLoginServer(db, companyName, agentCode, location);

    setAgentSession(res, { agentCode, companyName });
    return res.status(200).json({ success: true, companyName });
  } catch (err) {
    console.error('Agent login error:', err);
    return res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
}
