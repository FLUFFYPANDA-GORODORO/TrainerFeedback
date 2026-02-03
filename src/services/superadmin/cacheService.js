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
 */
export const updateCollegeCache = async (session, stats) => {
  try {
    const collegeId = session.collegeId;
    const cacheRef = doc(db, COLLEGE_CACHE_COLLECTION, collegeId);
    const cacheDoc = await getDoc(cacheRef);

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
      // For each rating answer, we need sum and count
      // Since categoryAverages is already averaged, we approximate by multiplying by responses
      const catCount = totalResponses; // Approximation - actual count per category not available
      categoryIncrements[cat] = {
        sum: avg * totalResponses,
        count: totalResponses
      };
    });

    // Course/Year/Batch values (preserve original names with dots)
    const courseName = session.course || 'Unknown';
    const yearName = session.year || '1';
    const batchName = session.batch || 'A';

    if (cacheDoc.exists()) {
      // Update existing cache with increments
      // First, update simple flat fields
      const baseUpdates = {
        totalSessions: increment(1),
        totalResponses: increment(totalResponses),
        totalRatingsCount: increment(totalRatingsCount),
        ratingSum: increment(ratingSum),
        updatedAt: new Date().toISOString()
      };

      // Increment rating distribution
      Object.entries(ratingDistribution || {}).forEach(([rating, count]) => {
        baseUpdates[`ratingDistribution.${rating}`] = increment(count);
      });

      // Increment category data (category names shouldn't have dots)
      Object.entries(categoryIncrements).forEach(([cat, data]) => {
        const safeCat = sanitizeFieldName(cat);
        baseUpdates[`categoryData.${safeCat}.sum`] = increment(data.sum);
        baseUpdates[`categoryData.${safeCat}.count`] = increment(data.count);
      });

      await updateDoc(cacheRef, baseUpdates);

      // Update nested course hierarchy using FieldPath (handles dots in names like 'B.E.')
      try {
        await updateDoc(cacheRef, {
          [new FieldPath('courses', courseName, 'totalResponses')]: increment(totalResponses),
          [new FieldPath('courses', courseName, 'totalRatingsCount')]: increment(totalRatingsCount),
          [new FieldPath('courses', courseName, 'ratingSum')]: increment(ratingSum),
          [new FieldPath('courses', courseName, 'years', yearName, 'totalResponses')]: increment(totalResponses),
          [new FieldPath('courses', courseName, 'years', yearName, 'totalRatingsCount')]: increment(totalRatingsCount),
          [new FieldPath('courses', courseName, 'years', yearName, 'ratingSum')]: increment(ratingSum),
          [new FieldPath('courses', courseName, 'years', yearName, 'batches', batchName, 'totalResponses')]: increment(totalResponses),
          [new FieldPath('courses', courseName, 'years', yearName, 'batches', batchName, 'totalRatingsCount')]: increment(totalRatingsCount),
          [new FieldPath('courses', courseName, 'years', yearName, 'batches', batchName, 'ratingSum')]: increment(ratingSum)
        });
      } catch (pathErr) {
        // If FieldPath fails (e.g., nested structure doesn't exist), we'll skip course hierarchy update
        console.warn('Could not update course hierarchy:', pathErr.message);
      }
    } else {
      // Create new cache document (nested objects work fine with original names)
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

      // Initialize category data
      Object.entries(categoryIncrements).forEach(([cat, data]) => {
        newCache.categoryData[cat] = { sum: data.sum, count: data.count };
      });

      await setDoc(cacheRef, newCache);
    }

    // Update daily trend
    await updateCollegeTrend(collegeId, session.sessionDate, totalResponses);

  } catch (error) {
    console.error('Error updating college cache:', error);
    throw error;
  }
};

/**
 * Update college daily trend
 */
const updateCollegeTrend = async (collegeId, sessionDate, responseCount) => {
  const yearMonth = getYearMonth(sessionDate);
  const day = getDayOfMonth(sessionDate);
  
  const trendRef = doc(db, COLLEGE_CACHE_COLLECTION, collegeId, 'trends', yearMonth);
  const trendDoc = await getDoc(trendRef);

  if (trendDoc.exists()) {
    await updateDoc(trendRef, {
      [`dailyResponses.${day}`]: increment(responseCount),
      [`dailySessions.${day}`]: increment(1)
    });
  } else {
    await setDoc(trendRef, {
      dailyResponses: { [day]: responseCount },
      dailySessions: { [day]: 1 }
    });
  }
};

/**
 * Update trainer cache after session close
 * @param {Object} session - The closed session object
 * @param {Object} stats - Compiled stats from the session
 */
export const updateTrainerCache = async (session, stats) => {
  try {
    const trainerId = session.assignedTrainer?.id;
    if (!trainerId) return;

    const cacheRef = doc(db, TRAINER_CACHE_COLLECTION, trainerId);
    const cacheDoc = await getDoc(cacheRef);

    const { totalResponses, ratingDistribution, categoryAverages } = stats;
    
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
        totalSessions: increment(1),
        totalResponses: increment(totalResponses),
        totalRatingsCount: increment(totalRatingsCount),
        ratingSum: increment(ratingSum),
        updatedAt: new Date().toISOString()
      };

      Object.entries(ratingDistribution || {}).forEach(([rating, count]) => {
        updates[`ratingDistribution.${rating}`] = increment(count);
      });

      Object.entries(categoryIncrements).forEach(([cat, data]) => {
        updates[`categoryData.${cat}.sum`] = increment(data.sum);
        updates[`categoryData.${cat}.count`] = increment(data.count);
      });

      await updateDoc(cacheRef, updates);
    } else {
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

      await setDoc(cacheRef, newCache);
    }

    // Update daily trend
    await updateTrainerTrend(trainerId, session.sessionDate, totalResponses);

  } catch (error) {
    console.error('Error updating trainer cache:', error);
    throw error;
  }
};

/**
 * Update trainer daily trend
 */
const updateTrainerTrend = async (trainerId, sessionDate, responseCount) => {
  const yearMonth = getYearMonth(sessionDate);
  const day = getDayOfMonth(sessionDate);
  
  const trendRef = doc(db, TRAINER_CACHE_COLLECTION, trainerId, 'trends', yearMonth);
  const trendDoc = await getDoc(trendRef);

  if (trendDoc.exists()) {
    await updateDoc(trendRef, {
      [`dailyResponses.${day}`]: increment(responseCount),
      [`dailySessions.${day}`]: increment(1)
    });
  } else {
    await setDoc(trendRef, {
      dailyResponses: { [day]: responseCount },
      dailySessions: { [day]: 1 }
    });
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
