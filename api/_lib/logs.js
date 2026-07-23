import { logsCollection } from './firebaseAdmin.js';

export async function recordAgentLoginServer(db, companyName, agentCode, location) {
  const entry = {
    companyName: companyName || '',
    agentCode: agentCode || '',
    location: location || 'Unknown',
    loggedAt: new Date().toISOString()
  };
  await logsCollection(db).add(entry);

  // Best-effort purge of anything older than ~30 days so the collection
  // doesn't grow forever. Non-fatal if it fails.
  try {
    const cutoffIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const staleSnap = await logsCollection(db).where('loggedAt', '<', cutoffIso).get();
    await Promise.all(staleSnap.docs.map(d => d.ref.delete()));
  } catch (err) {
    console.warn('Could not purge old agent login logs:', err);
  }
}
