// Server-only Firebase Admin SDK setup.
//
// This is what actually lets us stop shipping the agents list (and their
// passwords) to the browser: the Admin SDK runs here, on Vercel's servers,
// authenticated with a service account key — never in client JS.
//
// Set this in Vercel → Project → Settings → Environment Variables:
//   FIREBASE_SERVICE_ACCOUNT_KEY   (the full JSON key, as one string —
//                                    see README for how to generate it)
//
// APP_ID must match js/config.js's APP_ID so both sides read/write the same
// Firestore documents.
const APP_ID = process.env.FIREBASE_APP_ID || 'smc-tours-portal-v2';

let adminApp = null;
let firestoreDb = null;

async function getAdmin() {
  if (adminApp) return adminApp;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set in environment variables.');
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch (e) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON.');
  }

  const mod = await import('firebase-admin');
  const lib = mod.default ? mod.default : mod;

  // Reuse across warm serverless invocations instead of re-initializing,
  // which would otherwise throw "app already exists" on the next request.
  if (lib.apps && lib.apps.length) {
    adminApp = lib.apps[0];
  } else {
    adminApp = lib.initializeApp({ credential: lib.credential.cert(serviceAccount) });
  }

  return adminApp;
}

export async function getDb() {
  if (firestoreDb) return firestoreDb;
  const mod = await import('firebase-admin');
  const lib = mod.default ? mod.default : mod;
  await getAdmin();
  firestoreDb = lib.firestore();
  return firestoreDb;
}

export function agentsCollection(db) {
  return db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('agents');
}

export function packagesCollection(db) {
  return db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('packages');
}

export function logsCollection(db) {
  return db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('agent_login_logs');
}

export async function getFieldValue() {
  const admin = await import('firebase-admin');
  const lib = admin.default ? admin.default : admin;
  return lib.firestore.FieldValue;
}

export { APP_ID };
