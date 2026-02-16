import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { app, auth } from './firebase';

// Helper to get config from existing app
const getFirebaseConfig = () => app.options;

/**
 * Creates a user in Firebase Auth without logging out the current user.
 * This is done by creating a temporary secondary Firebase App instance.
 * 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<string>} The new user's UID
 */
export const createUserWithoutLoggingIn = async (email, password) => {
  let secondaryApp = null;
  try {
    const config = getFirebaseConfig();
    // Create a unique name for the secondary app to avoid conflicts
    const appName = `secondaryApp-${Date.now()}`;
    secondaryApp = initializeApp(config, appName);
    const secondaryAuth = getAuth(secondaryApp);

    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = userCredential.user.uid;

    // We don't need to sign out explicitly from secondary app as we are deleting it,
    // but good practice to ensure no lingering state if we weren't deleting.
    await signOut(secondaryAuth);
    
    return uid;
  } catch (error) {
    console.error('Error creating user in secondary app:', error);
    throw error;
  } finally {
    if (secondaryApp) {
      await deleteApp(secondaryApp);
    }
  }
};

/**
 * Standard Login
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

/**
 * Standard Logout
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};
/**
 * Send Password Reset Email
 */
export const sendPasswordReset = async (email) => {
  try {
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    const user = auth.currentUser;

    if (!user || !user.email) {
      throw new Error("No authenticated user found");
    }

    // 🔹 Re-authenticate with current password
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );

    await reauthenticateWithCredential(user, credential);

    // 🔹 Update password
    await updatePassword(user, newPassword);

    return true;

  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};