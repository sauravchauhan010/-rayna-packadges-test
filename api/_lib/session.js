// ─── SIGNED SESSION COOKIES ──────────────────────────────────────────────────
// Replaces the old approach of setting sessionStorage.rayna_admin_auth='true'
// on the client after login, which anyone could fake from DevTools with zero
// knowledge of the password. Now the server signs a token with a secret only
// it knows, and every admin/agent API route verifies that signature before
// doing anything sensitive.
//
// Set these in Vercel → Project → Settings → Environment Variables:
//   ADMIN_SESSION_SECRET   (any long random string, e.g. `openssl rand -hex 32`)
//   AGENT_SESSION_SECRET   (a different long random string)

import crypto from 'crypto';

const ADMIN_COOKIE = 'rayna_admin_session';
const AGENT_COOKIE = 'rayna_agent_session';
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(payloadObj, secret) {
  const payload = b64url(JSON.stringify(payloadObj));
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verify(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  // Constant-time compare to avoid timing attacks on the signature check.
  const a = Buffer.from(sig || '');
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp && Date.now() > data.exp) return null;
    return data;
  } catch (e) {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers?.cookie || '';
  const out = {};
  header.split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  });
  return out;
}

function cookieString(name, value, { maxAge } = {}) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (process.env.NODE_ENV !== 'development') parts.push('Secure');
  parts.push(`Max-Age=${maxAge != null ? maxAge : MAX_AGE_SECONDS}`);
  return parts.join('; ');
}

function clearCookieString(name) {
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

// ─── Admin session ───────────────────────────────────────────────────────
export function setAdminSession(res) {
  const token = sign({ role: 'admin', exp: Date.now() + MAX_AGE_SECONDS * 1000 }, process.env.ADMIN_SESSION_SECRET);
  res.setHeader('Set-Cookie', cookieString(ADMIN_COOKIE, token));
}

export function clearAdminSession(res) {
  res.setHeader('Set-Cookie', clearCookieString(ADMIN_COOKIE));
}

export function requireAdmin(req) {
  const cookies = parseCookies(req);
  const data = verify(cookies[ADMIN_COOKIE], process.env.ADMIN_SESSION_SECRET);
  return !!(data && data.role === 'admin');
}

// ─── Agent session ───────────────────────────────────────────────────────
export function setAgentSession(res, { agentCode, companyName }) {
  const token = sign(
    { role: 'agent', agentCode, companyName, exp: Date.now() + MAX_AGE_SECONDS * 1000 },
    process.env.AGENT_SESSION_SECRET
  );
  res.setHeader('Set-Cookie', cookieString(AGENT_COOKIE, token));
}

export function clearAgentSession(res) {
  res.setHeader('Set-Cookie', clearCookieString(AGENT_COOKIE));
}

export function getAgentSession(req) {
  const cookies = parseCookies(req);
  const data = verify(cookies[AGENT_COOKIE], process.env.AGENT_SESSION_SECRET);
  if (!data || data.role !== 'agent') return null;
  return { agentCode: data.agentCode, companyName: data.companyName };
}
