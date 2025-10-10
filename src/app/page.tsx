"use client";
import AuthGuard from "@/app/components/AuthGuard";
import GarageControls from "@/app/components/GarageControls";
import { useAuth } from "./hooks/useAuth";
import { useAccessControl } from "./hooks/useAccessControl";

export default function Home() {
  const { user, signOut } = useAuth();
  const { approved, loading, requestAccess } = useAccessControl(user);

  return (
    <AuthGuard>
      <div className="p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">ESP32 Garage Controller</h1>
          {user && (
            <div className="flex items-center gap-3 text-sm">
              <span>{user.email}</span>
              <button onClick={signOut} className="rounded border px-2 py-1">Sign out</button>
            </div>
          )}
        </div>

        {loading ? (
          <div>Loading access…</div>
        ) : approved ? (
          <GarageControls />
        ) : (
          <div className="flex flex-col gap-2">
            <p>Your account is not approved yet.</p>
            <button onClick={requestAccess} className="rounded border px-3 py-2 w-fit">Request Access</button>
            <p className="text-xs text-gray-500">Your request will be visible to the admin.</p>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
