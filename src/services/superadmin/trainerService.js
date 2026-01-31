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
  serverTimestamp,
  writeBatch,
  limit,
  startAfter
} from 'firebase/firestore';

const COLLECTION_NAME = 'trainers';

// Add a new trainer
export const addTrainer = async ({ trainer_id, name, domain, specialisation, topics = [], email, password }) => {
  try {
    // Check for duplicate trainer_id
    const q = query(collection(db, COLLECTION_NAME), where('trainer_id', '==', trainer_id));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      throw new Error(`Trainer with ID ${trainer_id} already exists.`);
    }

    // Note: Password is provided but not used for Auth creation yet as per requirements.
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        trainer_id,
        name,
        domain,
        specialisation,
        topics,
        email,
        // password, // explicitly NOT storing plain text password in DB unless requested, user said "password can be auto generated... not store the auth logic yet"
      createdAt: serverTimestamp()
    });

    return { id: docRef.id, trainer_id, name, email };
  } catch (error) {
    console.error('Error adding trainer:', error);
    throw error;
  }
};

// Update an existing trainer
export const updateTrainer = async (id, updates) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { id, ...updates };
  } catch (error) {
    console.error('Error updating trainer:', error);
    throw error;
  }
};

// Delete a trainer
export const deleteTrainer = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return true;
  } catch (error) {
    console.error('Error deleting trainer:', error);
    throw error;
  }
};

// Get all trainers (with pagination)
export const getAllTrainers = async (limitCount = 10, lastDoc = null) => {
  try {
    let q = query(collection(db, COLLECTION_NAME), limit(limitCount));
    
    if (lastDoc) {
      q = query(collection(db, COLLECTION_NAME), startAfter(lastDoc), limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    const trainers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { 
        trainers, 
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        hasMore: querySnapshot.docs.length === limitCount
    };
  } catch (error) {
    console.error('Error getting trainers:', error);
    throw error;
  }
};

// Get trainer by ID (Firestore Document ID)
export const getTrainerById = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting trainer:', error);
    throw error;
  }
};

// Batch add trainers
export const addTrainersBatch = async (trainers) => {
    const results = {
        success: [],
        errors: []
    };
    
    for (const trainer of trainers) {
        try {
            const added = await addTrainer(trainer);
            results.success.push(added);
        } catch (error) {
            results.errors.push({
                trainer_id: trainer.trainer_id,
                name: trainer.name,
                error: error.message
            });
        }
    }
    
    return results;
};
