import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  serverTimestamp,
  writeBatch,
  updateDoc
} from 'firebase/firestore';
import { getAcademicConfig } from './academicService';

const COLLECTION_NAME = 'project_codes';

/**
 * Parse a raw project code string into structured data.
 * Format: CollegeCode/Course/Year/Type/AcademicYear
 * Example: ICCS/MSC/1st/TP/25-27
 * 
 * @param {string} rawCode 
 * @returns {Object} Parsed fields + status
 */
export const parseProjectCode = (rawCode) => {
  if (!rawCode) return { status: 'invalid', error: 'Empty code' };

  const parts = rawCode.split('/').map(p => p.trim());
  
  // Basic validation: needs at least college and academic year (min 2 parts)
  if (parts.length < 2) {
    return { 
      rawCode,
      status: 'invalid', 
      error: 'Too few segments',
      parsed: null
    };
  }

  // Best-effort mapping based on position
  // 0: College Code
  // 1: Course
  // 2: Year
  // 3: Type (Ignored/Stored but not critical)
  // 4: Academic Year (Last non-empty usually, or fixed position)

  const collegeCode = parts[0];
  const academicYear = parts[parts.length - 1]; // Last part is usually year
  
  // Middle parts
  let course = parts.length > 1 ? parts[1] : '';
  let year = parts.length > 2 ? parts[2] : '';
  
  // [MODIFIED] Do NOT hardcode "Engg" -> "B.E." here.
  // Leave it as "Engg" (or whatever) to be resolved later against college config.
  // if (course.toLowerCase() === 'engg') {
  //   course = 'B.E.';
  // }

  // Extract numeric year
  const yearMatch = year.match(/\d+/);
  if (yearMatch) {
    year = yearMatch[0];
  }
  const type = parts.length > 3 ? parts[3] : '';

  return {
    rawCode,
    status: 'parsed',
    collegeCode,
    course, // Returns "Engg" if that's what is in the string
    year,
    type,
    academicYear
  };
};

/**
 * Match a parsed code against available colleges.
 * @param {Object} parsedData 
 * @param {Array} colleges 
 */
export const matchCollege = (parsedData, colleges) => {
  if (!parsedData || parsedData.status === 'invalid') return { ...parsedData, matchStatus: 'unmatched' };

  const matchedCollege = colleges.find(c => 
    c.code?.toLowerCase() === parsedData.collegeCode?.toLowerCase() || 
    c.name?.toLowerCase() === parsedData.collegeCode?.toLowerCase() // Fallback to name check
  );

  return {
    ...parsedData,
    collegeId: matchedCollege ? matchedCollege.id : null,
    collegeName: matchedCollege ? matchedCollege.name : null,
    matchStatus: matchedCollege ? 'matched' : 'unmatched'
  };
};

/**
 * Helper: Resolve "Engg" to "B.Tech" or "B.E." based on college config.
 */
const resolveCourseName = async (collegeId, rawCourse) => {
  if (!collegeId || !rawCourse) return rawCourse;
  
  // Only try to resolve if it's "Engg" (case-insensitive)
  if (rawCourse.toLowerCase() !== 'engg') return rawCourse;

  try {
    const config = await getAcademicConfig(collegeId);
    if (!config || !config.courses) return 'B.E.'; // Default to B.E. if no config

    const courses = Object.keys(config.courses);
    const hasBTech = courses.some(c => c.toLowerCase() === 'b.tech' || c.toLowerCase() === 'b. tech');
    const hasBE = courses.some(c => c.toLowerCase() === 'b.e.' || c.toLowerCase() === 'b.e');

    // Prefer B.Tech if available
    if (hasBTech) return 'B.Tech';
    if (hasBE) return 'B.E.';
    
    return 'B.E.'; // Default fallback
  } catch (err) {
    console.error(`Error resolving course for college ${collegeId}:`, err);
    return 'B.E.';
  }
};

/**
 * Helper: Resolve Year string (e.g. "4th", "Final") to config key (e.g. "4").
 */
const resolveYear = async (collegeId, courseName, rawYear) => {
  if (!collegeId || !courseName || !rawYear) return rawYear;
  
  try {
    const config = await getAcademicConfig(collegeId);
    if (!config || !config.courses || !config.courses[courseName]) return rawYear.replace(/\D/g, '');

    const courseData = config.courses[courseName];
    if (!courseData.departments) return rawYear.replace(/\D/g, '');

    // Collect all valid year keys from all departments
    const validYears = new Set();
    Object.values(courseData.departments).forEach(dept => {
      if (dept.years) {
        Object.keys(dept.years).forEach(y => validYears.add(y));
      }
    });

    // 1. Try exact match
    if (validYears.has(rawYear)) return rawYear;

    // 2. Try numeric extraction
    const numeric = rawYear.match(/\d+/)?.[0];
    if (numeric && validYears.has(numeric)) return numeric;

    // 3. Try word mappings
    const lower = rawYear.toLowerCase();
    const map = {
      'first': '1', '1st': '1', 'i': '1',
      'second': '2', '2nd': '2', 'ii': '2',
      'third': '3', '3rd': '3', 'iii': '3',
      'fourth': '4', '4th': '4', 'iv': '4', 'final': '4'
    };
    
    // Check known mappings against valid years
    for (const [key, val] of Object.entries(map)) {
      if (lower.includes(key) && validYears.has(val)) {
        return val;
      }
    }

    // Default: return numeric extraction if available, else raw
    return numeric || rawYear;

  } catch (err) {
    console.error(`Error resolving year for college ${collegeId}:`, err);
    return rawYear.replace(/\D/g, '');
  }
};

/**
 * Bulk add project codes.
 * - Parses and matches each code.
 * - [NEW] Resolves "Engg" to correct course name.
 * - [NEW] Resolves Year to config key.
 * - Checks for duplicates in DB (by rawCode).
 * - Saves to Firestore in batches.
 * 
 * @param {string[]} rawCodes - Array of raw code strings
 * @param {Array} colleges - List of existing colleges for matching
 */
export const addProjectCodes = async (rawCodes, colleges) => {
  try {
    const uniqueRawCodes = [...new Set(rawCodes.filter(c => c && c.trim()))];
    const processed = [];

    // 1. Process all codes locally first
    for (const raw of uniqueRawCodes) {
      const parsed = parseProjectCode(raw);
      const matched = matchCollege(parsed, colleges);
      
      // [NEW] Resolve Course & Year if matched
      if (matched.matchStatus === 'matched' && matched.collegeId) {
        matched.course = await resolveCourseName(matched.collegeId, matched.course);
        matched.year = await resolveYear(matched.collegeId, matched.course, matched.year);
      }
      
      processed.push(matched);
    }

    // 2. Check for existing codes in DB to avoid duplicates
    const existingSnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const existingCodes = new Set(existingSnapshot.docs.map(d => d.data().code));

    const newDocs = processed.filter(p => !existingCodes.has(p.rawCode));

    if (newDocs.length === 0) return { added: 0, skipped: processed.length };

    // 3. Batch write (max 500 ops per batch)
    const batch = writeBatch(db);
    let count = 0;

    newDocs.forEach(item => {
      const docRef = doc(collection(db, COLLECTION_NAME));
      batch.set(docRef, {
        code: item.rawCode, // Main identifier
        collegeCode: item.collegeCode || '',
        collegeId: item.collegeId || null,
        collegeName: item.collegeName || '',
        course: item.course || '',
        year: item.year || '',
        type: item.type || '',
        academicYear: item.academicYear || '',
        parseStatus: item.status,
        matchStatus: item.matchStatus,
        createdAt: serverTimestamp()
      });
      count++;
    });

    await batch.commit();
    return { added: count, skipped: processed.length - count };

  } catch (error) {
    console.error('Error adding project codes:', error);
    throw error;
  }
};

/**
 * Get all project codes
 */
export const getAllProjectCodes = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting project codes:', error);
    throw error;
  }
};

/**
 * Delete a project code
 */
export const deleteProjectCode = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return true;
  } catch (error) {
    console.error('Error deleting project code:', error);
    throw error;
  }
};

/**
 * Rerun matching for all unmatched project codes against current colleges.
 * Useful when new colleges are added.
 */
export const rerunCollegeMatching = async (colleges) => {
  try {
    // 1. Get all unmatched codes
    const q = query(collection(db, COLLECTION_NAME), where('matchStatus', '==', 'unmatched'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return 0;

    const batch = writeBatch(db);
    let updatedCount = 0;

    // Use for...of to handle await inside loop correctly
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      // Try matching again
      const parsed = {
        collegeCode: data.collegeCode,
        status: data.parseStatus,
        course: data.course || '' // Keep existing course for now
      };
      
      const matched = matchCollege(parsed, colleges);

      if (matched.matchStatus === 'matched') {
         // [NEW] Resolve Course Name
         const resolvedCourse = await resolveCourseName(matched.collegeId, data.course);
         const resolvedYear = await resolveYear(matched.collegeId, resolvedCourse, data.year);

         batch.update(docSnap.ref, {
            collegeId: matched.collegeId,
            collegeName: matched.collegeName,
            matchStatus: 'matched',
            course: resolvedCourse, // Update course if changed
            year: resolvedYear, // Update year if changed
            updatedAt: serverTimestamp()
         });
         updatedCount++;
      }
    }

    if (updatedCount > 0) {
      await batch.commit();
    }

    return updatedCount;
  } catch (error) {
    console.error('Error rerunning matching:', error);
    throw error;
  }
};

