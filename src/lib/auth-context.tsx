"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ensureUserProfile } from "@/app/actions/auth-actions";
import type { UserRole } from "@/lib/roles";

type Role = UserRole | null;

interface AuthContextType {
  user: User | null;
  role: Role;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // The profile and its role live behind a server action; the client has
        // no write access to `users`, so it cannot assign itself a role.
        const result = await ensureUserProfile(
          await firebaseUser.getIdToken(),
          firebaseUser.displayName || undefined,
        );
        setRole(result.success && result.data ? result.data.role : null);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });

    // `onAuthStateChanged` also fires and calls this with the account's own
    // name; the action only fills a blank displayName, so the stated name wins.
    await ensureUserProfile(await userCredential.user.getIdToken(), name);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);

    await ensureUserProfile(
      await userCredential.user.getIdToken(),
      userCredential.user.displayName || undefined,
    );
  };

  const signOutUser = async () => {
    await firebaseSignOut(auth);
  };

  const value: AuthContextType = {
    user,
    role,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut: signOutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
