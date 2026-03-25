import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Register with email/password
export async function registerWithEmail(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await createUserDocument(user, displayName);
    return { user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
}

// Login with email/password
export async function loginWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
}

// Google Sign-In
export async function loginWithGoogle() {
  const mapError = (error) => ({
    user: null,
    error: error?.message || "Google sign-in failed",
    code: error?.code || "auth/unknown",
  });

  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      await createUserDocument(user, user.displayName);
    }
    return { user, error: null, method: "popup" };
  } catch (error) {
    const popupBlockedCodes = new Set([
      "auth/popup-blocked",
      "auth/popup-closed-by-user",
      "auth/cancelled-popup-request",
      "auth/operation-not-supported-in-this-environment",
    ]);

    if (popupBlockedCodes.has(error?.code)) {
      try {
        await signInWithRedirect(auth, googleProvider);
        return { user: null, error: null, method: "redirect" };
      } catch (redirectError) {
        return mapError(redirectError);
      }
    }

    return mapError(error);
  }
}

// Sign out
export async function logoutUser() {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

// Create admin user (for admin setup - requires secure context)
export async function createAdminUser(email, password, displayName = "Admin") {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await createUserDocument(user, displayName, true); // pass isAdmin=true
    return { user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
}

// Create user document in Firestore
async function createUserDocument(user, displayName, isAdmin = false) {
  const userRef = doc(db, "users", user.uid);
  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: displayName || user.displayName || "Anonymous",
    photoURL: user.photoURL || null,
    saved: [],
    created_at: serverTimestamp(),
  };
  
  if (isAdmin) {
    userData.isAdmin = true;
  }
  
  await setDoc(userRef, userData);
}

// Get user document from Firestore
export async function getUserDocument(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) return { data: userDoc.data(), error: null };
    return { data: null, error: "User not found" };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

// Auth state listener
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
