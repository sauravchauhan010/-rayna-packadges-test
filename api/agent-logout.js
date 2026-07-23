// POST /api/agent-logout — clears the agent session cookie.

import { clearAgentSession } from './_lib/session.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  clearAgentSession(res);
  return res.status(200).json({ success: true });
}
