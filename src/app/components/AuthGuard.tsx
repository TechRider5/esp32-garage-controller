"use client";
import { ReactNode } from "react";
import { useAuth } from "@/app/hooks/useAuth";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return <div>Loading…</div>;
  if (!user)
    return (
      <div className="flex flex-col gap-3">
        <p>You must sign in to continue.</p>
        <button onClick={signIn} className="rounded border px-3 py-2">Sign in with Google</button>
      </div>
    );
  return <>{children}</>;
}

