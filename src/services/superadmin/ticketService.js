import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  where,
  serverTimestamp 
} from 'firebase/firestore';

const COLLECTION_NAME = 'tickets';

/**
 * Create a new support ticket
 */
export const createTicket = async (ticketData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...ticketData,
      status: 'open',
      adminNotes: '',
      resolvedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...ticketData, status: 'open' };
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
};

/**
 * Get all tickets (SuperAdmin) — ordered by creation date desc
 */
export const getAllTickets = async () => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
  } catch (error) {
    console.error('Error getting tickets:', error);
    throw error;
  }
};

/**
 * Get tickets raised by a specific user
 */
export const getTicketsByUser = async (uid) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('raisedBy.uid', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
  } catch (error) {
    console.error('Error getting user tickets:', error);
    throw error;
  }
};

/**
 * Update ticket status (SuperAdmin)
 */
export const updateTicketStatus = async (id, status, adminNotes = '') => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updates = {
      status,
      adminNotes,
      updatedAt: serverTimestamp()
    };
    // Set resolvedAt when ticket is resolved or closed
    if (status === 'resolved' || status === 'closed') {
      updates.resolvedAt = serverTimestamp();
    }
    await updateDoc(docRef, updates);
    return { id, status, adminNotes };
  } catch (error) {
    console.error('Error updating ticket:', error);
    throw error;
  }
};

/**
 * Delete a ticket (SuperAdmin)
 */
export const deleteTicket = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return true;
  } catch (error) {
    console.error('Error deleting ticket:', error);
    throw error;
  }
};

/**
 * Utility: check if a ticket is overdue (7+ days old and still open/in-progress)
 */
export const isTicketOverdue = (ticket) => {
  if (ticket.status === 'resolved' || ticket.status === 'closed') return false;
  if (!ticket.createdAt) return false;
  
  const createdDate = ticket.createdAt.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
  const now = new Date();
  const diffDays = (now - createdDate) / (1000 * 60 * 60 * 24);
  return diffDays >= 7;
};

/**
 * Utility: get age of ticket in days
 */
export const getTicketAgeDays = (ticket) => {
  if (!ticket.createdAt) return 0;
  const createdDate = ticket.createdAt.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
  const now = new Date();
  return Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
};
