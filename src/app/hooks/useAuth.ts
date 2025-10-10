"use client";
import { useEffect, useMemo, useState } from "react";
import { auth, provider } from "@/app/lib/firebase";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, User, getRedirectResult } from "firebase/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Finalize any pending redirect sign-in
    getRedirectResult(auth).catch(() => {/* ignore if none */});

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    }, (e) => {
      setError(e?.message || String(e));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const actions = useMemo(() => ({
    async signIn() {
      try {
        await signInWithPopup(auth, provider as GoogleAuthProvider);
      } catch (err: unknown) {
        const code = typeof err === "object" && err && "code" in err ? (err as { code?: string }).code : undefined;
        const fallback = ["auth/popup-blocked", "auth/operation-not-supported-in-this-environment", "auth/popup-closed-by-user"]; 
        if (!code || fallback.includes(code)) {
          await signInWithRedirect(auth, provider as GoogleAuthProvider);
        } else {
          throw err;
        }
      }
    },
    async signOut() {
      await signOut(auth);
    }
  }), []);

  return { user, loading, error, ...actions };
}

