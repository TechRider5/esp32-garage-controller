"use client";
import { db } from "@/app/lib/firebase";
import { onValue, ref, set } from "firebase/database";
import { useEffect, useState } from "react";

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
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button onClick={() => send("door1")} className="rounded border px-3 py-2">Open Door 1</button>
        <button onClick={() => send("door2")} className="rounded border px-3 py-2">Open Door 2</button>
      </div>
      <div className="text-sm text-gray-600">LED: {ledStatus}</div>
      {lastUpdated && <div className="text-xs text-gray-500">Last updated: {new Date(lastUpdated * 1000).toLocaleString()}</div>}
      {error && <div className="text-sm text-red-500">Error: {error}</div>}
    </div>
  );
}

