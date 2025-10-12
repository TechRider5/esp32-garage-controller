"use client";
import { useState } from "react";

interface GarageDoorButtonProps {
  doorNumber: 1 | 2;
  onTrigger: (door: "door1" | "door2") => void;
  disabled?: boolean;
}

export default function GarageDoorButton({ doorNumber, onTrigger, disabled = false }: GarageDoorButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    setIsPressed(true);
    
    try {
      await onTrigger(`door${doorNumber}` as "door1" | "door2");
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setIsPressed(false);
      }, 1000);
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={`
          relative w-64 h-80 bg-gradient-to-b from-gray-300 to-gray-400 rounded-lg shadow-lg
          transform transition-all duration-300 ease-out
          hover:scale-105 hover:-translate-y-2 hover:shadow-2xl
          active:scale-95 active:translate-y-0
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          ${isPressed ? 'scale-95 translate-y-0' : ''}
          border-4 border-gray-500 hover:border-gray-600
        `}
      >
        {/* Garage Door Panels */}
        <div className="absolute inset-2 bg-gradient-to-b from-gray-200 to-gray-300 rounded border-2 border-gray-400">
          {/* Horizontal panels */}
          <div className="absolute top-4 left-2 right-2 h-8 bg-gray-400 rounded-sm"></div>
          <div className="absolute top-16 left-2 right-2 h-8 bg-gray-400 rounded-sm"></div>
          <div className="absolute top-28 left-2 right-2 h-8 bg-gray-400 rounded-sm"></div>
          <div className="absolute top-40 left-2 right-2 h-8 bg-gray-400 rounded-sm"></div>
          <div className="absolute top-52 left-2 right-2 h-8 bg-gray-400 rounded-sm"></div>
          
          {/* Handle */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-6 h-12 bg-gray-600 rounded-full border-2 border-gray-700"></div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Door Number Badge */}
        <div className="absolute -top-3 -right-3 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
          {doorNumber}
        </div>
      </button>

      {/* Label */}
      <div className="text-center mt-4">
        <h3 className="text-lg font-semibold text-white drop-shadow-lg">
          Door {doorNumber}
        </h3>
        <p className="text-white/80 text-sm">
          {isLoading ? "Opening..." : "Click to open"}
        </p>
      </div>

      {/* Hover Effect Glow */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-indigo-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
}
