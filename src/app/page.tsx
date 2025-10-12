"use client";
import AuthGuard from "@/app/components/AuthGuard";
import GarageControls from "@/app/components/GarageControls";
import Navbar from "@/app/components/Navbar";
import ThemeProvider from "@/app/components/ThemeProvider";
import { useAuth } from "./hooks/useAuth";
import { useAccessControl } from "./hooks/useAccessControl";

export default function Home() {
  const { user } = useAuth();
  const { approved, loading, requestAccess } = useAccessControl(user);

  return (
    <ThemeProvider>
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <Navbar />
          
          <main className="container mx-auto px-4 py-8">
            {loading ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : approved ? (
              <GarageControls />
            ) : (
              <div className="max-w-md mx-auto">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
                  <h2 className="text-2xl font-bold text-white mb-4">Access Required</h2>
                  <p className="text-white/80 mb-6">
                    Your account is not approved yet. Request access to control the garage doors.
                  </p>
                  <button 
                    onClick={requestAccess} 
                    className="bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                  >
                    Request Access
                  </button>
                  <p className="text-white/60 text-sm mt-4">
                    Your request will be visible to the admin.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </AuthGuard>
    </ThemeProvider>
  );
}
