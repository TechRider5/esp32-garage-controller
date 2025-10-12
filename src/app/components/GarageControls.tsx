"use client";
import { db } from "@/app/lib/firebase";
import { onValue, ref, set } from "firebase/database";
import { useEffect, useState } from "react";
import GarageDoorButton from "./GarageDoorButton";

export default function GarageControls() {
  const [ledStatus, setLedStatus] = useState<string>("off");
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const statusRef = ref(db, "ledStatus");
    const timeRef = ref(db, "lastUpdated");
    const unsub1 = onValue(statusRef, (snap) => setLedStatus(snap.val() || "off"));
    const unsub2 = onValue(timeRef, (snap) => setLastUpdated(Number(snap.val()) || null));
    return () => { unsub1(); unsub2(); };
  }, []);

  const send = async (cmd: "door1" | "door2") => {
    setError(null);
    try {
      await set(ref(db, "doorCommand"), cmd);
    } catch (e) {
      setError((e as Error).message || String(e));
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Garage Door Buttons */}
      <div className="flex flex-col sm:flex-row gap-8 items-center">
        <GarageDoorButton doorNumber={1} onTrigger={send} />
        <GarageDoorButton doorNumber={2} onTrigger={send} />
      </div>

      {/* Status Display */}
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20">
        <div className="flex items-center gap-4 text-white">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${ledStatus === 'online' ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm font-medium">Status: {ledStatus}</span>
          </div>
          {lastUpdated && (
            <div className="text-xs text-white/70">
              Last updated: {new Date(lastUpdated * 1000).toLocaleString()}
            </div>
          )}
        </div>
        {error && (
          <div className="mt-2 text-sm text-red-300 bg-red-500/20 rounded px-3 py-2">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
}

