import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { getCollegeById } from './collegeService';

const COLLECTION_NAME = 'academic_configs';

/**
 * Save or Overwrite Academic Configuration for a College.
 * Use this for creating or completely replacing the config.
 * 
 * Schema Structure (New as of 2026-02-17):
 * {
 *   courses: {
 *     "B.Tech": {
 *       years: {
 *         "1": {
 *          departments: {
 *              "CSE": {
 *                batches: ["A", "B"] ,
 *              }
 *            }
 *         },
 *        "2": {
 *          departments: {
 *              "CSE": {
 *                batches: ["A", "B"] ,
 *              }
 *            }
 *         }
 *       }
 *     }
 *   }
 * }
 */
export const saveAcademicConfig = async (collegeId, configData) => {
  try {
    // 0. Validate Structure
    validateAcademicConfig(configData);

    // 1. Verify College ID and get details
    const college = await getCollegeById(collegeId);
    if (!college) {
      throw new Error(`Invalid College ID: ${collegeId}. College does not exist.`);
    }

    const docRef = doc(db, COLLECTION_NAME, collegeId);
    
    // 2. Save config with redundant college info
    await setDoc(docRef, {
      collegeId,
      collegeName: college.name,
      collegeCode: college.code,
      ...configData,
      updatedAt: serverTimestamp()
    });

    return { 
      collegeId, 
      collegeName: college.name, 
      collegeCode: college.code, 
      ...configData,
      updatedAt: serverTimestamp() 
    };
  } catch (error) {
    console.error('Error saving academic config:', error);
    throw error;
  }
};

/**
 * Validate that the config follows the Course -> Year -> Department -> Batches structure.
 * Throws error if invalid.
 */
const validateAcademicConfig = (config) => {
  if (!config || !config.courses) return; // Allow empty config (initial state)

  Object.entries(config.courses).forEach(([courseName, courseData]) => {
    // Level 1: Course (Should contain 'years', NOT 'departments')
    if (courseData.departments) {
      throw new Error(`Invalid Structure for course '${courseName}': Found 'departments' directly under course. Expected 'years'.`);
    }
    
    if (!courseData.years) return; // Empty course is fine

    Object.entries(courseData.years).forEach(([year, yearData]) => {
       // Level 2: Year (Should contain 'departments')
       if (!yearData.departments) {
          // This might be valid if just added, but let's check strictness. 
          // If the structure expects it, we should check. 
          // However, UI might save partial states. Let's be lenient on missing keys, strict on WRONG keys.
          return; 
       }

       Object.entries(yearData.departments).forEach(([deptName, deptData]) => {
          // Level 3: Department (Should contain 'batches')
          if (deptData.years) {
             throw new Error(`Invalid Structure for department '${deptName}' in '${courseName}' Year ${year}: Found 'years' under department. Expected 'batches'.`);
          }
          
          if (deptData.batches && !Array.isArray(deptData.batches)) {
             throw new Error(`Invalid Structure: 'batches' must be an array for ${courseName} > Year ${year} > ${deptName}.`);
          }
       });
    });
  });
};

/**
 * Update Academic Configuration (Partial Update).
 * Useful for adding batches, departments, or courses without sending the entire object.
 * 
 * @param {string} collegeId - The ID of the college (used as document ID)
 * @param {Object} updates - The partial data to update. 
 * Use dot notation for nested fields if using standard Map structure.
 */
export const updateAcademicConfig = async (collegeId, updates) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, collegeId);
    
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    return { collegeId, ...updates };
  } catch (error) {
    console.error('Error updating academic config:', error);
    throw error;
  }
};

/**
 * Get Academic Configuration by College ID
 */
export const getAcademicConfig = async (collegeId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, collegeId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
       return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting academic config:', error);
    throw error;
  }
};
