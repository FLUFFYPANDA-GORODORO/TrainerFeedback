
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, writeBatch, query, where } from 'firebase/firestore';
import { updateCollegeCache, updateTrainerCache, updateQualitativeCache } from './cacheService';

/**
 * Rebuild Analytics Cache
 * 
 * 1. Deletes all existing documents in `collegeCache` and `trainerCache`.
 * 2. Fetches all 'inactive' (closed) sessions.
 * 3. Re-runs the cache update logic for each session.
 */

const clearCollection = async (collectionName) => {
  const q = query(collection(db, collectionName));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  
  if (snapshot.empty) return;

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Cleared collection: ${collectionName}`);
};

export const rebuildCache = async () => {
  try {
    console.log('🔄 Starting Cache Rebuild...');
    
    // 1. Clear existing cache
    console.log('🗑️ Clearing existing cache...');
    await clearCollection('collegeCache');
    await clearCollection('trainerCache');
    
    // 2. Fetch all inactive sessions
    console.log('📥 Fetching inactive sessions...');
    const sessionsRef = collection(db, 'sessions');
    const q = query(sessionsRef, where('status', '==', 'inactive'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('⚠️ No inactive sessions found to rebuild cache from.');
      return;
    }

    const sessions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`Found ${sessions.length} sessions to process.`);

    // 3. Process each session
    let processed = 0;
    const errors = [];

    for (const session of sessions) {
      if (!session.compiledStats) {
        console.warn(`Skipping session ${session.id}: No compiledStats found.`);
        continue;
      }

      try {
        await Promise.all([
          updateCollegeCache(session, session.compiledStats),
          updateTrainerCache(session, session.compiledStats),
          updateQualitativeCache(session, session.compiledStats)
        ]);
        processed++;
        if (processed % 5 === 0) console.log(`   Processed ${processed}/${sessions.length}...`);
      } catch (err) {
        console.error(`Error processing session ${session.id}:`, err);
        errors.push({ id: session.id, error: err.message });
      }
    }

    console.log('\n✅ Cache Rebuild Complete!');
    console.log(`Total Processed: ${processed}`);
    console.log(`Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.table(errors);
    }

  } catch (error) {
    console.error('❌ Cache Rebuild Failed:', error);
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.rebuildCache = rebuildCache;
  console.log('🛠️ rebuildCache function available. Run `rebuildCache()` to fix analytics.');
}

export default rebuildCache;
