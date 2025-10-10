"use client";
import AdminGuard from "@/app/components/AdminGuard";
import { db } from "@/app/lib/firebase";
import { onValue, ref, remove, set, update } from "firebase/database";
import { useEffect, useMemo, useState } from "react";

type Request = { email: string; requestedAt: number };
type UserRow = { email: string; approved?: boolean; role?: string };

export default function AdminPage() {
  const [requests, setRequests] = useState<Record<string, Request>>({});
  const [users, setUsers] = useState<Record<string, UserRow>>({});
  const [manualEmail, setManualEmail] = useState("");

  useEffect(() => {
    const reqRef = ref(db, "accessRequests");
    const usrRef = ref(db, "users");
    const unsub1 = onValue(reqRef, (snap) => setRequests(snap.val() || {}));
    const unsub2 = onValue(usrRef, (snap) => setUsers(snap.val() || {}));
    return () => { unsub1(); unsub2(); };
  }, []);

  const approve = async (uid: string, email: string) => {
    await update(ref(db, `users/${uid}`), { email, approved: true, role: "user" });
    await remove(ref(db, `accessRequests/${uid}`));
  };

  const deny = async (uid: string) => remove(ref(db, `accessRequests/${uid}`));
  const revoke = async (uid: string) => update(ref(db, `users/${uid}`), { approved: false });

  const approvedUsers = useMemo(
    () => Object.entries(users).filter(([, v]) => !!v.approved),
    [users]
  );

  return (
    <AdminGuard>
      <div className="p-6 flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Admin Panel</h1>

        <section>
          <h2 className="text-lg font-medium mb-2">Pending Access Requests</h2>
          <div className="flex flex-col gap-2">
            {Object.keys(requests).length === 0 && <div className="text-sm text-gray-500">No requests</div>}
            {Object.entries(requests).map(([uid, r]) => (
              <div key={uid} className="flex items-center justify-between border rounded p-2">
                <div className="text-sm">
                  <div>{r.email}</div>
                  <div className="text-xs text-gray-500">Requested {new Date(r.requestedAt).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approve(uid, r.email)} className="rounded border px-2 py-1">Approve</button>
                  <button onClick={() => deny(uid)} className="rounded border px-2 py-1">Deny</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-2">Approved Users</h2>
          <div className="flex flex-col gap-2">
            {approvedUsers.length === 0 && <div className="text-sm text-gray-500">No approved users</div>}
            {approvedUsers.map(([uid, u]) => (
              <div key={uid} className="flex items-center justify-between border rounded p-2">
                <div className="text-sm">
                  <div>{u.email}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => revoke(uid)} className="rounded border px-2 py-1">Revoke</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-2">Manual Add</h2>
          <div className="flex gap-2 items-center">
            <input value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} placeholder="user@example.com" className="border rounded px-2 py-1" />
            <button
              className="rounded border px-3 py-1"
              onClick={async () => {
                if (!manualEmail) return;
                // Create a pseudo entry; will align when user signs in
                const pseudoUid = manualEmail.replace(/[^a-zA-Z0-9]/g, "_");
                await set(ref(db, `users/${pseudoUid}`), { email: manualEmail, approved: true, role: "user" });
                setManualEmail("");
              }}
            >
              Grant Access
            </button>
          </div>
        </section>
      </div>
    </AdminGuard>
  );
}

