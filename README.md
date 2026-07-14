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
│   ├── login.js            Serverless function: admin login (checks env vars)
│   └── drive-folder.js     Serverless function: proxies the Drive files.list call
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
| `GOOGLE_API_KEY` | `api/drive-folder.js` | Google Cloud API key with Drive API enabled |
| `DRIVE_FOLDER_ID` | `api/drive-folder.js` | Optional — overrides the folder ID hardcoded in the file |

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

## Security note

The Google Drive API key that used to live in the client-side JavaScript
(visible to anyone via "View Source") has been moved into
`api/drive-folder.js`, which reads it from `GOOGLE_API_KEY` on the server.
The Firebase config in `js/config.js` is meant to be public — Firebase's
actual security boundary is your Firestore rules, not hiding that key.
