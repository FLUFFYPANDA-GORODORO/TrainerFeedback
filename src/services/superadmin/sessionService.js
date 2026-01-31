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
  orderBy,
  limit
} from 'firebase/firestore';

const COLLECTION_NAME = 'sessions';

// Create a new session
export const createSession = async (sessionData) => {
  try {
    const {
        collegeId, 
        collegeName, 
        academicYear, 
        course, 
        branch, 
        batch, 
        year, 
        sessionTime, // 'Morning' | 'Afternoon'
        sessionDate, 
        assignedTrainer, // { id, name }
        topic, 
        domain, 
        sessionDuration = 60, // minutes
        questions = [], 
        ttl = 24, // hours until expiry
        projectId = ''
    } = sessionData;

    // Calculate expiresAt based on sessionDate and TTL
    // Assuming sessionDate is YYYY-MM-DD
    const expiryDate = new Date(sessionDate);
    // Add 1 day if afternoon? Or just use TTL from start of day?
    // Let's assume TTL starts from end of session day or just generic hours
    // Simple approach: ExpiresAt = SessionDate (end of day) + TTL hours? 
    // Or simpler: SessionDate + 1 day.
    // User asked for "auto close the status to expired after x time".
    // Let's store expiresAt as a timestamp. 
    expiryDate.setHours(expiryDate.getHours() + parseInt(ttl) + 24); // Default 24h buffer from start of date?

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      collegeId,
      collegeName,
      academicYear,
      course,
      branch,
      batch,
      year,
      sessionTime,
      sessionDate,
      assignedTrainer,
      topic,
      domain,
      sessionDuration,
      questions,
      projectId,
      status: 'active',
      templateId: 'generated-template-id', // Placeholder
      expiresAt: expiryDate.toISOString(),
      createdAt: serverTimestamp()
    });

    return { id: docRef.id, ...sessionData };
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

// Update an existing session
export const updateSession = async (id, updates) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { id, ...updates };
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
};

// Delete a session
export const deleteSession = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
};

// Get all sessions (allows filtering)
export const getAllSessions = async (collegeId = null) => {
  try {
    let q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    
    if (collegeId) {
      q = query(collection(db, COLLECTION_NAME), where('collegeId', '==', collegeId), orderBy('createdAt', 'desc'));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting sessions:', error);
    throw error;
  }
};

// Get session by ID
export const getSessionById = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting session:', error);
    throw error;
  }
};
