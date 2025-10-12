"use client";
import AdminGuard from "@/app/components/AdminGuard";
import Navbar from "@/app/components/Navbar";
import ThemeProvider from "@/app/components/ThemeProvider";
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
    <ThemeProvider>
      <AdminGuard>
        <div className="min-h-screen">
          <Navbar />
          
          <main className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold text-white mb-8">Admin Panel</h1>

              <div className="grid gap-6">
                {/* Pending Requests */}
                <section className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <h2 className="text-xl font-semibold text-white mb-4">Pending Access Requests</h2>
                  <div className="space-y-3">
                    {Object.keys(requests).length === 0 && (
                      <p className="text-white/60 text-center py-4">No pending requests</p>
                    )}
                    {Object.entries(requests).map(([uid, r]) => (
                      <div key={uid} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">{r.email}</div>
                          <div className="text-white/60 text-sm">
                            Requested {new Date(r.requestedAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => approve(uid, r.email)} 
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => deny(uid)} 
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Approved Users */}
                <section className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <h2 className="text-xl font-semibold text-white mb-4">Approved Users</h2>
                  <div className="space-y-3">
                    {approvedUsers.length === 0 && (
                      <p className="text-white/60 text-center py-4">No approved users</p>
                    )}
                    {approvedUsers.map(([uid, u]) => (
                      <div key={uid} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                        <div className="text-white font-medium">{u.email}</div>
                        <button 
                          onClick={() => revoke(uid)} 
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Revoke Access
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Manual Add */}
                <section className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <h2 className="text-xl font-semibold text-white mb-4">Manual Add User</h2>
                  <div className="flex gap-3">
                    <input 
                      value={manualEmail} 
                      onChange={(e) => setManualEmail(e.target.value)} 
                      placeholder="user@example.com" 
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30" 
                    />
                    <button
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                      onClick={async () => {
                        if (!manualEmail) return;
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
            </div>
          </main>
        </div>
      </AdminGuard>
    </ThemeProvider>
  );
}

