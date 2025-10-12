"use client";
import { useEffect } from "react";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    const defaultTheme = 'from-indigo-500 via-purple-500 to-pink-500';
    const theme = savedTheme || defaultTheme;
    
    // Apply theme to CSS custom property
    document.documentElement.style.setProperty('--theme-gradient', theme);
    
    // Add theme class to body for global styling
    document.body.className = `bg-gradient-to-br ${theme} min-h-screen`;
  }, []);

  return <>{children}</>;
}
