"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthChange, getUserDocument } from "../lib/authService";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        console.log("🔐 Firebase user authenticated:", firebaseUser.email);
        
        const { data } = await getUserDocument(firebaseUser.uid);
        if (data) {
          console.log("✅ User document found");
          setUserDoc(data);
        } else {
          console.log("⚠️ User document not found, creating one...");
          // Create user document if it doesn't exist
          try {
            const newUserDoc = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || "User",
              photoURL: firebaseUser.photoURL || null,
              saved: [],
              isAdmin: false,
              created_at: serverTimestamp(),
            };
            
            await setDoc(doc(db, "users", firebaseUser.uid), newUserDoc);
            console.log("✅ User document created successfully");
            setUserDoc(newUserDoc);
          } catch (err) {
            console.error("❌ Error creating user document:", err);
            // Still set basic user data even if doc creation fails
            setUserDoc({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || "User",
              isAdmin: false,
            });
          }
        }
      } else {
        setUser(null);
        setUserDoc(null);
        console.log("🚪 User logged out");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const refreshUserDoc = async () => {
    if (user) {
      const { data } = await getUserDocument(user.uid);
      setUserDoc(data);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userDoc, loading, refreshUserDoc }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
