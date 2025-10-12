"use client";
import { ReactNode } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import SignInCard from "./SignInCard";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user) {
    return <SignInCard />;
  }
  
  return <>{children}</>;
}

