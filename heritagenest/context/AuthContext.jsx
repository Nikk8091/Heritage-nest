"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthChange, getUserDocument } from "../lib/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const { data } = await getUserDocument(firebaseUser.uid);
        setUserDoc(data);
      } else {
        setUser(null);
        setUserDoc(null);
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
