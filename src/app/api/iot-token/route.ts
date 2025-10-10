import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.IOT_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let deviceId: string | null = null;
  const { searchParams } = new URL(req.url);
  deviceId = searchParams.get("deviceId");
  if (!deviceId) {
    try {
      const json = await req.json();
      deviceId = json?.deviceId ?? null;
    } catch {}
  }

  if (!deviceId) {
    return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });
  }

  try {
    const customToken = await adminAuth.createCustomToken(deviceId, { kind: "iot", deviceId });
    return NextResponse.json({ customToken });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Token error" }, { status: 500 });
  }
}

