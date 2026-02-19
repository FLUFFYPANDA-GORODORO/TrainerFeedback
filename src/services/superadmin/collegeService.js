import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';

const COLLECTION_NAME = 'colleges';

// Add a new college
export const addCollege = async ({ name, code, logoUrl = '' }) => {
  try {
    // Check for duplicate code
    const q = query(collection(db, COLLECTION_NAME), where('code', '==', code));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      throw new Error(`College with code ${code} already exists.`);
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      name,
      code,
      logoUrl,
      createdAt: serverTimestamp()
    });

    return { id: docRef.id, name, code, logoUrl };
  } catch (error) {
    console.error('Error adding college:', error);
    throw error;
  }
};

// Update an existing college
export const updateCollege = async (id, updates) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { id, ...updates };
  } catch (error) {
    console.error('Error updating college:', error);
    throw error;
  }
};

// Delete a college
export const deleteCollege = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return true;
  } catch (error) {
    console.error('Error deleting college:', error);
    throw error;
  }
};

// Get all colleges
export const getAllColleges = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting colleges:', error);
    throw error;
  }
};

// Get college by ID
export const getCollegeById = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting college:', error);
    throw error;
  }
};

// Bulk add colleges
export const bulkAddColleges = async (collegesArray) => {
  try {
    if (!Array.isArray(collegesArray) || collegesArray.length === 0) {
      throw new Error('Please provide a non-empty array of colleges.');
    }

    // Fetch all existing codes to check for duplicates
    const existingSnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const existingCodes = new Set(
      existingSnapshot.docs.map(doc => doc.data().code?.toUpperCase())
    );

    let added = 0;
    let skipped = 0;
    const errors = [];

    for (const item of collegesArray) {
      const name = (item.Name || item.name || '').trim();
      const code = (item['College Code'] || item.code || '').trim().toUpperCase();
      const logoUrl = (item.logoUrl || item.LogoUrl || '').trim();

      if (!name || !code) {
        skipped++;
        errors.push(`Skipped entry with missing name or code: ${JSON.stringify(item)}`);
        continue;
      }

      if (existingCodes.has(code)) {
        skipped++;
        errors.push(`Skipped duplicate code: ${code}`);
        continue;
      }

      try {
        await addDoc(collection(db, COLLECTION_NAME), {
          name,
          code,
          logoUrl,
          createdAt: serverTimestamp()
        });
        existingCodes.add(code); // prevent duplicates within the same batch
        added++;
      } catch (err) {
        errors.push(`Failed to add ${code}: ${err.message}`);
      }
    }

    return { added, skipped, errors };
  } catch (error) {
    console.error('Error bulk adding colleges:', error);
    throw error;
  }
};
