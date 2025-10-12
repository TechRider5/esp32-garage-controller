"use client";
import { useAuth } from "@/app/hooks/useAuth";
import { useAccessControl } from "@/app/hooks/useAccessControl";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAccessControl(user);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const themes = [
    { name: "Default", gradient: "from-indigo-500 via-purple-500 to-pink-500" },
    { name: "Ocean", gradient: "from-blue-500 via-cyan-500 to-teal-500" },
    { name: "Sunset", gradient: "from-orange-500 via-red-500 to-pink-500" },
    { name: "Forest", gradient: "from-green-500 via-emerald-500 to-teal-500" },
    { name: "Night", gradient: "from-gray-800 via-gray-900 to-black" },
  ];

  const applyTheme = (gradient: string) => {
    document.documentElement.style.setProperty('--theme-gradient', gradient);
    localStorage.setItem('theme', gradient);
    setShowThemePicker(false);
  };

  return (
    <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Title */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-white hover:text-white/80 transition-colors">
              🚗 Garage Controller
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {/* Admin Link */}
            <Link
              href="/admin"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isAdmin 
                  ? "text-white hover:bg-white/20" 
                  : "text-white/50 cursor-not-allowed"
              }`}
              onClick={(e) => !isAdmin && e.preventDefault()}
            >
              Admin
            </Link>

            {/* Theme Picker */}
            <div className="relative">
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
                title="Change theme"
              >
                🎨
              </button>
              
              {showThemePicker && (
                <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 py-2">
                  {themes.map((theme) => (
                    <button
                      key={theme.name}
                      onClick={() => applyTheme(theme.gradient)}
                      className="w-full px-4 py-2 text-left text-white hover:bg-white/20 transition-colors flex items-center gap-3"
                    >
                      <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${theme.gradient}`}></div>
                      {theme.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Info & Sign Out */}
            {user && (
              <div className="flex items-center space-x-3">
                <span className="text-white/80 text-sm hidden sm:block">
                  {user.email}
                </span>
                <button
                  onClick={signOut}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/20 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
