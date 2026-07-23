# Premium Group Departures Portal

A customer-facing site with package browsing, a hotel directory, agent
(agent code + password) login for private files, an admin-only login log
of agent sign-ins, and an admin dashboard for managing departures and the
agent access list.

## Project structure

```
├── index.html              Page shell — links css/styles.css and js/main.js
├── css/
│   └── styles.css          All styling (unchanged from the original)
├── js/
│   ├── config.js           Non-secret constants (Firebase config, IDs, seed data)
│   ├── firebase.js         Firebase app/auth/db initialization
│   ├── state.js            Shared app state object + small helpers (esc, saveLocal)
│   ├── db.js               Orchestrates Firestore listeners + local fallback
│   ├── db-packages.js      Packages collection: listener, CRUD, admin form handlers
│   ├── db-agents.js        Agents (Access List) collection: listener, CRUD, admin form handlers
│   ├── db-logs.js          Agent login logs: listener, record-on-login, clear-all
│   ├── agent-auth.js       Customer-facing agent login (agent code + password)
│   ├── admin-auth.js       Admin dashboard login (calls /api/login)
│   ├── drive.js            Fetches the agent's private file list via /api/drive-folder
│   ├── dispatch.js         Central UI dispatch() + delete-confirmation handlers
│   ├── views.js            All render*() functions that build HTML strings
│   ├── render.js           Top-level render() loop that drives the whole UI
│   └── main.js             Entry point — wires everything up, runs the boot sequence
├── api/
│   ├── login.js               Admin login — checks env vars, sets a signed session cookie
│   ├── logout.js              Clears the admin session cookie
│   ├── session-check.js       Lets the client verify its admin session is still valid
│   ├── agent-login.js         Agent login — checks a bcrypt hash server-side, sets agent session cookie
│   ├── agent-logout.js        Clears the agent session cookie
│   ├── agent-session-check.js Lets the client verify its agent session is still valid
│   ├── agents.js              Admin-only agent CRUD (Admin SDK) — passwords never returned to client
│   ├── agent-logs.js          Admin-only login log read/clear (Admin SDK)
│   ├── drive-folder.js        Proxies the Drive files.list call — now requires a valid agent session
│   ├── agent-location.js      Returns approximate city/country from Vercel's IP geolocation headers
│   └── _lib/
│       ├── firebaseAdmin.js   Firebase Admin SDK singleton (service account, server-only)
│       ├── session.js         Signed HttpOnly cookie helpers for admin + agent sessions
│       └── logs.js            Server-side login recording + auto-purge
├── firestore.rules            Firestore Security Rules (copy into Firebase Console → Rules)
├── package.json
├── .env.example
└── README.md
```

## How it fits together

This is intentionally **not** a framework rewrite — it's the same
vanilla-JS, no-build-step app as before, just split into files by
responsibility instead of living in one `<script>` tag. `state` is a single
mutable object imported by reference everywhere; any module can update
`state.someField` and call `render()` to reflect it, exactly like before.

Module dependency direction (no circular imports):

```
config.js → firebase.js → views.js → render.js → {db-packages, db-agents, db-logs, drive, admin-auth}.js → {db.js, dispatch.js, agent-auth.js} → main.js
```

## Local development

```bash
npm i -g vercel
vercel dev
```

This serves `index.html` + the `/js` and `/css` folders as static files and
runs the `/api` functions locally, exactly like production.

## Environment variables

Copy `.env.example` to `.env` for local dev, and set the same values in
**Vercel → Project → Settings → Environment Variables** for your deployment:

| Variable | Used by | Purpose |
|---|---|---|
| `ADMIN_USERNAME` | `api/login.js` | Admin dashboard username |
| `ADMIN_PASSWORD` | `api/login.js` | Admin dashboard password |
| `ADMIN_SESSION_SECRET` | `api/_lib/session.js` | Signs the admin session cookie — random string, e.g. `openssl rand -hex 32` |
| `AGENT_SESSION_SECRET` | `api/_lib/session.js` | Signs the agent session cookie — a *different* random string |
| `GOOGLE_API_KEY` | `api/drive-folder.js` | Google Cloud API key with Drive API enabled |
| `DRIVE_FOLDER_ID` | `api/drive-folder.js` | Optional — overrides the folder ID hardcoded in the file |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | `api/_lib/firebaseAdmin.js` | Full JSON service account key (Firebase Console → Project Settings → Service Accounts → Generate new private key) |
| `FIREBASE_APP_ID` | `api/_lib/firebaseAdmin.js` | Optional — only if your `APP_ID` in `js/config.js` isn't `smc-tours-portal-v2` |

**Important:** if you already have a working `api/login.js` deployed with
your real admin-auth logic, keep that one — the version in this project is
a template so the folder structure is complete, and expects credentials via
environment variables rather than however your existing one checks them.

## Firebase setup reminders

- Firestore holds three collections under `artifacts/{APP_ID}/public/data/`:
  `packages`, `agents`, and `agent_login_logs` (created automatically the
  first time an agent successfully signs in).
- Agent login is plain agent-code + password, checked against the `agents`
  collection — no Firebase Authentication sign-in method needs enabling for
  this.
- Login location (city/country) comes from Vercel's automatic IP
  geolocation request headers via `api/agent-location.js` — no API key, no
  configuration, and no cost. It only works once actually deployed on
  Vercel; locally via `vercel dev` it will show "Unknown".

## Security note

Several real issues were fixed in this pass:

- **Agent passwords were previously loaded into every visitor's browser**
  via a live Firestore listener (`attachAgentsListener`), in plaintext, even
  before anyone logged in. Agent data now never reaches the client at all —
  it's read/written only by `api/agents.js` and `api/agent-login.js` using
  the Firebase **Admin SDK** (service account, server-only). Passwords are
  hashed with bcrypt, and any old plaintext ones are auto-upgraded to a hash
  the first time that agent logs in successfully.
- **Both admin and agent "login" used to just set a client-side flag**
  (`sessionStorage`/`localStorage`) with nothing server-verified backing
  it — anyone could open DevTools and fake being logged in. Login now sets
  a signed, HttpOnly session cookie (`api/_lib/session.js`); every
  sensitive route checks that signature server-side before doing anything.
- **`api/drive-folder.js` had no server-side check at all** — the "agent
  only" gate was purely a client-side `if`. It now requires a valid signed
  agent session cookie.
- The Google Drive API key lives only in `api/drive-folder.js`, read from
  `GOOGLE_API_KEY` server-side — never shipped to the browser.
- The Firebase client config in `js/config.js` is meant to be public —
  Firebase's actual security boundary is Firestore rules (see
  `firestore.rules` in this repo — copy it into the Firebase Console's
  Rules tab), not hiding that config.

**Known follow-up, not yet done:** package (tour departure) create/edit/
delete still goes through the client Firestore SDK directly
(`js/db-packages.js`), gated only by the admin UI's login state — not a
server route. This is lower risk than the agent/admin issues above (it's
public marketing content, not credentials), but someone who found a way to
call Firestore directly could still deface the package list. `firestore.rules`
leaves package writes open on purpose for now so this doesn't break — the
next step would be an admin-gated `/api/packages` route mirroring
`api/agents.js`, then locking that down in the rules too.
