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
 * Schema Structure:
 * {
 *   courses: {
 *     "B.Tech": {
 *       departments: {
 *         "CSE": {
 *           years: {
 *             "1": { batches: ["A", "B"] },
 *             "2": { batches: ["A", "B"] }
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 */
export const saveAcademicConfig = async (collegeId, configData) => {
  try {
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

    // Note: serverTimestamp() is not resolved immediately in return value, 
    // so we return the input data + local fallback if needed for UI optimistic update
    return { 
      collegeId, 
      collegeName: college.name, 
      collegeCode: college.code, 
      ...configData,
      updatedAt: new Date().toISOString() 
    };
  } catch (error) {
    console.error('Error saving academic config:', error);
    throw error;
  }
};

/**
 * Update Academic Configuration (Partial Update).
 * Useful for adding batches, departments, or courses without sending the entire object.
 * 
 * @param {string} collegeId - The ID of the college (used as document ID)
 * @param {Object} updates - The partial data to update. 
 * Use dot notation for nested fields if using standard Map structure, e.g.:
 * { "courses.BTech.years.1.batches": ["A", "B", "C"] }
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
