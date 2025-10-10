"use client";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/app/lib/firebase";
import { onValue, ref, set, update } from "firebase/database";
import type { User } from "firebase/auth";

const ADMIN_EMAIL = "ethanh6305@gmail.com";

export function useAccessControl(user: User | null) {
  const [approved, setApproved] = useState<boolean | null>(null);
  const [role, setRole] = useState<"admin" | "user" | null>(null);
  const [loading, setLoading] = useState<boolean>(!!user);

  useEffect(() => {
    if (!user) {
      setApproved(null);
      setRole(null);
      setLoading(false);
      return;
    }

    const userRef = ref(db, `users/${user.uid}`);
    const unsub = onValue(userRef, (snap) => {
      const val = snap.val();
      if (!val) {
        // Seed entry for admins on first login
        if (user.email === ADMIN_EMAIL) {
          update(userRef, { email: user.email, role: "admin", approved: true });
          setApproved(true);
          setRole("admin");
        } else {
          setApproved(false);
          setRole("user");
        }
      } else {
        setApproved(!!val.approved);
        const roleValue = (val.role as "admin" | "user" | undefined);
        setRole(roleValue || (user.email === ADMIN_EMAIL ? "admin" : "user"));
      }
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const isAdmin = user?.email === ADMIN_EMAIL || role === "admin";

  const actions = useMemo(() => ({
    async requestAccess() {
      if (!user) return;
      const reqRef = ref(db, `accessRequests/${user.uid}`);
      await set(reqRef, { email: user.email, requestedAt: Date.now() });
    },
  }), [user]);

  return { approved, role, isAdmin, loading, ...actions };
}

