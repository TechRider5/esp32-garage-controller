"use client";
import { ReactNode } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { useAccessControl } from "@/app/hooks/useAccessControl";

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { isAdmin, loading: aclLoading } = useAccessControl(user);

  if (loading || aclLoading) return <div>Loading…</div>;
  if (!user) return <div>Not signed in.</div>;
  if (!isAdmin) return <div>Admins only.</div>;
  return <>{children}</>;
}

