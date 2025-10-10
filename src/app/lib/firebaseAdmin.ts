import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

let adminApp: App | undefined;

if (!getApps().length) {
  const raw = process.env.FIREBASE_ADMIN_SDK_KEY || "{}";
  const serviceAccount: Record<string, unknown> = JSON.parse(raw);
  adminApp = initializeApp({
    credential: cert(serviceAccount as { [key: string]: string }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
} else {
  adminApp = getApps()[0]!;
}

export const adminAuth = getAuth(adminApp);
export const adminDb = getDatabase(adminApp);

