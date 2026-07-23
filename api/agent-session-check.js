// GET /api/agent-session-check — tells the client whether it holds a valid
// signed agent session cookie, and who it belongs to. Used on page load to
// decide whether to show the hotels view as unlocked.

import { getAgentSession } from './_lib/session.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = getAgentSession(req);
  return res.status(200).json({ loggedIn: !!session, companyName: session?.companyName || '', agentCode: session?.agentCode || '' });
}
