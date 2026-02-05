import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  increment,
  FieldPath
} from 'firebase/firestore';

/**
 * Cache Service
 * Handles analytics cache updates for colleges and trainers
 */

const COLLEGE_CACHE_COLLECTION = 'collegeCache';
const TRAINER_CACHE_COLLECTION = 'trainerCache';

/**
 * Get current year-month string (e.g., "2026-02")
 */
const getYearMonth = (dateStr) => {
  const date = dateStr ? new Date(dateStr) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Get day of month string (e.g., "03")
 */
const getDayOfMonth = (dateStr) => {
  const date = dateStr ? new Date(dateStr) : new Date();
  return String(date.getDate()).padStart(2, '0');
};

/**
 * Sanitize field name for Firestore paths
 * Firestore uses dots as path separators, so we replace them with underscores
 * e.g., "B.E." becomes "B_E_"
 * NOTE: This is only used for simple single-level paths. For nested course hierarchy,
 * we use separate updates with FieldPath which handles dots properly.
 */
const sanitizeFieldName = (name) => {
  if (!name) return 'unknown';
  return String(name).replace(/\./g, '_').trim();
};

/**
 * Helper to update a nested field using FieldPath (handles dots in field names)
 * @param {DocumentReference} docRef 
 * @param {string[]} pathSegments - Array of path segments e.g., ['courses', 'B.E.', 'totalResponses']
 * @param {any} value - Value to set
 */
const updateNestedField = async (docRef, pathSegments, value) => {
  const fieldPath = new FieldPath(...pathSegments);
  await updateDoc(docRef, { [fieldPath]: value });
};

/**
 * Update college cache after session close
 * @param {Object} session - The closed session object
 * @param {Object} stats - Compiled stats from the session
 * @param {boolean} isDelete - Whether this is a deletion (decrement stats)
 * @param {Object} transaction - Optional Firestore transaction
 */
export const updateCollegeCache = async (session, stats, isDelete = false, transaction = null) => {
  try {
    const collegeId = session.collegeId;
    const cacheRef = doc(db, COLLEGE_CACHE_COLLECTION, collegeId);
    
    // Read: Use transaction if available
    const cacheDoc = transaction ? await transaction.get(cacheRef) : await getDoc(cacheRef);

    const { totalResponses, ratingDistribution, categoryAverages } = stats;
    
    // Calculate rating sum and count from distribution
    const ratingSum = Object.entries(ratingDistribution || {}).reduce(
      (sum, [rating, count]) => sum + (Number(rating) * count), 0
    );
    // Total individual ratings (not responses)
    const totalRatingsCount = Object.values(ratingDistribution || {}).reduce(
      (sum, count) => sum + count, 0
    );

    // Build category data increments
    const categoryIncrements = {};
    Object.entries(categoryAverages || {}).forEach(([cat, avg]) => {
      const catCount = totalResponses; 
      categoryIncrements[cat] = {
         sum: avg * totalResponses,
         count: totalResponses
      };
    });

    const courseName = session.course || 'Unknown';
    const yearName = session.year || '1';
    const batchName = session.batch || 'A';

    if (cacheDoc.exists()) {
      // Update existing cache with increments
      const multiplier = isDelete ? -1 : 1;

      const baseUpdates = {
        totalSessions: increment(1 * multiplier),
        totalResponses: increment(totalResponses * multiplier),
        totalRatingsCount: increment(totalRatingsCount * multiplier),
        ratingSum: increment(ratingSum * multiplier),
        updatedAt: new Date().toISOString()
      };

      Object.entries(ratingDistribution || {}).forEach(([rating, count]) => {
        baseUpdates[`ratingDistribution.${rating}`] = increment(count * multiplier);
      });

      Object.entries(categoryIncrements).forEach(([cat, data]) => {
        const safeCat = sanitizeFieldName(cat);
        baseUpdates[`categoryData.${safeCat}.sum`] = increment(data.sum * multiplier);
        baseUpdates[`categoryData.${safeCat}.count`] = increment(data.count * multiplier);
      });

      if (transaction) {
         transaction.update(cacheRef, baseUpdates);
      } else {
         await updateDoc(cacheRef, baseUpdates);
      }

      // Note: Nested FieldPath updates for 'courses' are complex in transactions because
      // transaction.update() requires a flat object or strictly alternating varargs in some SDKs.
      // JS SDK v9 transaction.update(ref, data) works similar to updateDoc.
      // However, we'll strip the complex nested course updates from the transaction path for now 
      // to reduce risk, as global stats are the priority. 
      // Re-enabling with standard update approach if safe.
      
      try {
         // Construct nested update object
         const nestedUpdates = {};
         const addNested = (pathSegments, val) => {
             // FieldPath not directly usable as key in simple JS object without computed property name
             // but transaction.update takes an object map.
             nestedUpdates[new FieldPath(...pathSegments)] = val;
         };
         
         addNested(['courses', courseName, 'totalResponses'], increment(totalResponses * multiplier));
         addNested(['courses', courseName, 'totalRatingsCount'], increment(totalRatingsCount * multiplier));
         addNested(['courses', courseName, 'ratingSum'], increment(ratingSum * multiplier));
         // ... deeper levels omitted for brevity/safety in transaction refactor, 
         // can be re-added if critical. For now ensuring global consistency.
         
         // Only apply if we have something to update and IF we are not in a transaction 
         // OR if we trust transaction.update handles FieldPath keys correctly (it usually does).
         // Given the complexity/race risk, let's defer deep nested updates to non-critical path 
         // or handle them carefully. To keep it simple, we WILL apply them.
         
         const courseUpdates = {
              [new FieldPath('courses', courseName, 'totalResponses')]: increment(totalResponses * multiplier),
              [new FieldPath('courses', courseName, 'totalRatingsCount')]: increment(totalRatingsCount * multiplier),
              [new FieldPath('courses', courseName, 'ratingSum')]: increment(ratingSum * multiplier),
              [new FieldPath('courses', courseName, 'years', yearName, 'totalResponses')]: increment(totalResponses * multiplier),
              [new FieldPath('courses', courseName, 'years', yearName, 'totalRatingsCount')]: increment(totalRatingsCount * multiplier),
              [new FieldPath('courses', courseName, 'years', yearName, 'ratingSum')]: increment(ratingSum * multiplier),
              [new FieldPath('courses', courseName, 'years', yearName, 'batches', batchName, 'totalResponses')]: increment(totalResponses * multiplier),
              [new FieldPath('courses', courseName, 'years', yearName, 'batches', batchName, 'totalRatingsCount')]: increment(totalRatingsCount * multiplier),
              [new FieldPath('courses', courseName, 'years', yearName, 'batches', batchName, 'ratingSum')]: increment(ratingSum * multiplier)
         };
         
         if (transaction) {
             transaction.update(cacheRef, courseUpdates);
         } else {
             await updateDoc(cacheRef, courseUpdates);
         }
      } catch (pathErr) {
        console.warn('Could not update course hierarchy:', pathErr.message);
      }

    } else if (!isDelete) {
      // Create new
      const newCache = {
        totalSessions: 1,
        totalResponses,
        totalRatingsCount,
        ratingSum,
        ratingDistribution: ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        categoryData: {},
        courses: {
          [courseName]: {
            totalResponses,
            totalRatingsCount,
            ratingSum,
            years: {
              [yearName]: {
                totalResponses,
                totalRatingsCount,
                ratingSum,
                batches: {
                   [batchName]: { totalResponses, totalRatingsCount, ratingSum }
                }
              }
            }
          }
        },
        updatedAt: new Date().toISOString()
      };
      
      Object.entries(categoryIncrements).forEach(([cat, data]) => {
         newCache.categoryData[cat] = { sum: data.sum, count: data.count };
      });

      if (transaction) {
          transaction.set(cacheRef, newCache);
      } else {
          await setDoc(cacheRef, newCache);
      }
    }

    // Update daily trend
    await updateCollegeTrend(collegeId, session.sessionDate, totalResponses, isDelete, transaction);

  } catch (error) {
    console.error('Error updating college cache:', error);
    throw error;
  }
};

/**
 * Update college daily trend
 */
const updateCollegeTrend = async (collegeId, sessionDate, responseCount, isDelete = false, transaction = null) => {
  const yearMonth = getYearMonth(sessionDate);
  const day = getDayOfMonth(sessionDate);
  const multiplier = isDelete ? -1 : 1;
  const trendRef = doc(db, COLLEGE_CACHE_COLLECTION, collegeId, 'trends', yearMonth);
  
  const trendDoc = transaction ? await transaction.get(trendRef) : await getDoc(trendRef);

  if (trendDoc.exists()) {
    const updates = {
      [`dailyResponses.${day}`]: increment(responseCount * multiplier),
      [`dailySessions.${day}`]: increment(1 * multiplier)
    };
    if (transaction) transaction.update(trendRef, updates);
    else await updateDoc(trendRef, updates);
  } else if (!isDelete) {
    const newData = {
      dailyResponses: { [day]: responseCount },
      dailySessions: { [day]: 1 }
    };
    if (transaction) transaction.set(trendRef, newData);
    else await setDoc(trendRef, newData);
  }
};

/**
 * Update trainer cache after session close
 */
export const updateTrainerCache = async (session, stats, isDelete = false, transaction = null) => {
  try {
    const trainerId = session.assignedTrainer?.id;
    if (!trainerId) return;

    const cacheRef = doc(db, TRAINER_CACHE_COLLECTION, trainerId);
    const cacheDoc = transaction ? await transaction.get(cacheRef) : await getDoc(cacheRef);

    const { totalResponses, ratingDistribution, categoryAverages } = stats;
    
    // Calculate sums...
    const ratingSum = Object.entries(ratingDistribution || {}).reduce(
      (sum, [rating, count]) => sum + (Number(rating) * count), 0
    );
    const totalRatingsCount = Object.values(ratingDistribution || {}).reduce(
      (sum, count) => sum + count, 0
    );

    const categoryIncrements = {};
    Object.entries(categoryAverages || {}).forEach(([cat, avg]) => {
      categoryIncrements[cat] = {
        sum: avg * totalResponses,
        count: totalResponses
      };
    });

    if (cacheDoc.exists()) {
      const updates = {
        totalSessions: increment(1 * (isDelete ? -1 : 1)),
        totalResponses: increment(totalResponses * (isDelete ? -1 : 1)),
        totalRatingsCount: increment(totalRatingsCount * (isDelete ? -1 : 1)),
        ratingSum: increment(ratingSum * (isDelete ? -1 : 1)),
        updatedAt: new Date().toISOString()
      };

      const multiplier = isDelete ? -1 : 1;
      Object.entries(ratingDistribution || {}).forEach(([rating, count]) => {
        updates[`ratingDistribution.${rating}`] = increment(count * multiplier);
      });
      Object.entries(categoryIncrements).forEach(([cat, data]) => {
        updates[`categoryData.${cat}.sum`] = increment(data.sum * multiplier);
        updates[`categoryData.${cat}.count`] = increment(data.count * multiplier);
      });

      if (transaction) transaction.update(cacheRef, updates);
      else await updateDoc(cacheRef, updates);

    } else if (!isDelete) {
       const newCache = {
        totalSessions: 1,
        totalResponses,
        totalRatingsCount,
        ratingSum,
        ratingDistribution: ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        categoryData: {},
        updatedAt: new Date().toISOString()
       };
       Object.entries(categoryIncrements).forEach(([cat, data]) => {
           newCache.categoryData[cat] = { sum: data.sum, count: data.count };
       });

       if (transaction) transaction.set(cacheRef, newCache);
       else await setDoc(cacheRef, newCache);
    }

    // Update daily trend
    await updateTrainerTrend(trainerId, session.sessionDate, totalResponses, isDelete, transaction);

  } catch (error) {
    console.error('Error updating trainer cache:', error);
    throw error;
  }
};

/**
 * Update trainer daily trend
 */
const updateTrainerTrend = async (trainerId, sessionDate, responseCount, isDelete = false, transaction = null) => {
  const yearMonth = getYearMonth(sessionDate);
  const day = getDayOfMonth(sessionDate);
  const multiplier = isDelete ? -1 : 1;
  
  const trendRef = doc(db, TRAINER_CACHE_COLLECTION, trainerId, 'trends', yearMonth);
  const trendDoc = transaction ? await transaction.get(trendRef) : await getDoc(trendRef);

  if (trendDoc.exists()) {
    const updates = {
      [`dailyResponses.${day}`]: increment(responseCount * multiplier),
      [`dailySessions.${day}`]: increment(1 * multiplier)
    };
    if (transaction) transaction.update(trendRef, updates);
    else await updateDoc(trendRef, updates);
  } else if (!isDelete) {
    const newData = {
      dailyResponses: { [day]: responseCount },
      dailySessions: { [day]: 1 }
    };
    if (transaction) transaction.set(trendRef, newData);
    else await setDoc(trendRef, newData);
  }
};

// ============ READ FUNCTIONS ============

/**
 * Get college cache data
 */
export const getCollegeCache = async (collegeId) => {
  try {
    const cacheRef = doc(db, COLLEGE_CACHE_COLLECTION, collegeId);
    const cacheDoc = await getDoc(cacheRef);
    
    if (cacheDoc.exists()) {
      return { id: cacheDoc.id, ...cacheDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting college cache:', error);
    throw error;
  }
};

/**
 * Get college trends for a specific month (or current month)
 */
export const getCollegeTrends = async (collegeId, yearMonth = null) => {
  try {
    const month = yearMonth || getYearMonth();
    const trendRef = doc(db, COLLEGE_CACHE_COLLECTION, collegeId, 'trends', month);
    const trendDoc = await getDoc(trendRef);
    
    if (trendDoc.exists()) {
      return { yearMonth: month, ...trendDoc.data() };
    }
    return { yearMonth: month, dailyResponses: {}, dailySessions: {} };
  } catch (error) {
    console.error('Error getting college trends:', error);
    throw error;
  }
};

/**
 * Get trainer cache data
 */
export const getTrainerCache = async (trainerId) => {
  try {
    const cacheRef = doc(db, TRAINER_CACHE_COLLECTION, trainerId);
    const cacheDoc = await getDoc(cacheRef);
    
    if (cacheDoc.exists()) {
      return { id: cacheDoc.id, ...cacheDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting trainer cache:', error);
    throw error;
  }
};

/**
 * Get trainer trends for a specific month (or current month)
 */
export const getTrainerTrends = async (trainerId, yearMonth = null) => {
  try {
    const month = yearMonth || getYearMonth();
    const trendRef = doc(db, TRAINER_CACHE_COLLECTION, trainerId, 'trends', month);
    const trendDoc = await getDoc(trendRef);
    
    if (trendDoc.exists()) {
      return { yearMonth: month, ...trendDoc.data() };
    }
    return { yearMonth: month, dailyResponses: {}, dailySessions: {} };
  } catch (error) {
    console.error('Error getting trainer trends:', error);
    throw error;
  }
};

/**
 * Get sessions by trainer and college for filtered analytics
 * Used when both trainer and college filters are active
 */
/**
 * Get sessions by trainer and college for filtered analytics
 * Used when both trainer and college filters are active
 */
export const getSessionsByTrainerAndCollege = async (trainerId, collegeId) => {
  try {
    const sessionsRef = collection(db, 'sessions');
    const q = query(
      sessionsRef,
      where('collegeId', '==', collegeId),
      where('assignedTrainer.id', '==', trainerId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting sessions by trainer and college:', error);
    throw error;
  }
};

// ============ QUALITATIVE INSIGHTS ============

/**
 * Merge and Rank Comments for Cache
 * Keeps Top 3 based on criteria
 */
const mergeComments = (existing, incoming, type) => {
  // 1. Combine lists
  let combined = [...(existing || []), ...(incoming || [])];

  // 2. Deduplicate (by unique responseId)
  const seen = new Set();
  combined = combined.filter(c => {
    const uid = c.responseId;
    if (seen.has(uid)) return false;
    seen.add(uid);
    return true;
  });

  // 3. Sort based on Type
  // Ensure ratings are numbers and dates are comparable
  combined.forEach(c => {
    c.rating = Number(c.rating || c.avgRating || 0);
  });

  if (type === 'high') {
    // Highest Rating first, then Newest
    combined.sort((a, b) => (b.rating - a.rating) || (new Date(b.date) - new Date(a.date)));
  } else if (type === 'low') {
    // Lowest Rating first, then Newest
    combined.sort((a, b) => (a.rating - b.rating) || (new Date(b.date) - new Date(a.date)));
  } else {
    // Avg / Recent: Just Newest
    combined.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // 4. Keep Top 3
  return combined.slice(0, 3);
};

/**
 * Update Qualitative Cache (Comments)
 * This is called AFTER the critical transaction to avoid bloating it.
 * It merges new top comments into the college and trainer cache.
 */
export const updateQualitativeCache = async (session, stats) => {
  try {
    const { topComments, leastRatedComments, avgComments } = stats;
    
    // Helper to format comments for cache (add metadata)
    const formatForCache = (comments) => comments.map(c => ({
      text: c.text,
      rating: c.avgRating,
      responseId: c.responseId,
      sessionId: session.id,
      date: session.sessionDate || new Date().toISOString(),
      course: session.course,
      trainerName: session.assignedTrainer?.name
    }));

    const newHigh = formatForCache(topComments || []);
    const newLow = formatForCache(leastRatedComments || []);
    const newAvg = formatForCache(avgComments || []);

    // 1. Update College Cache
    if (session.collegeId) {
      const collegeRef = doc(db, 'collegeCache', session.collegeId);
      const collegeDoc = await getDoc(collegeRef);
      
      if (collegeDoc.exists()) {
        const currentData = collegeDoc.data().qualitative || { high: [], low: [], avg: [] };
        
        const updatedQualitative = {
          high: mergeComments(currentData.high, newHigh, 'high'),
          low: mergeComments(currentData.low, newLow, 'low'),
          avg: mergeComments(currentData.avg, newAvg, 'avg')
        };
        
        await updateDoc(collegeRef, { qualitative: updatedQualitative });
      }
    }

    // 2. Update Trainer Cache
    if (session.assignedTrainer?.id) {
      const trainerRef = doc(db, 'trainerCache', session.assignedTrainer.id);
      const trainerDoc = await getDoc(trainerRef);
      
      if (trainerDoc.exists()) {
        const currentData = trainerDoc.data().qualitative || { high: [], low: [], avg: [] };
        
        const updatedQualitative = {
          high: mergeComments(currentData.high, newHigh, 'high'),
          low: mergeComments(currentData.low, newLow, 'low'),
          avg: mergeComments(currentData.avg, newAvg, 'avg')
        };
        
        await updateDoc(trainerRef, { qualitative: updatedQualitative });
      }
    }

  } catch (error) {
    console.error('Error updating qualitative cache:', error);
    // Suppress error as this is non-critical
  }
};
