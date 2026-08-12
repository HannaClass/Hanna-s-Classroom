import { NextResponse } from "next/server";

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request) {
  const { password } = await request.json();

  if (!password || password !== process.env.TEACHER_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // A simple session token derived from the password + a server secret.
  // Not bank-grade security, but fine for a single-teacher tool with no
  // sensitive payment/personal data stored beyond lesson notes.
  const token = await sha256Hex(
    password + (process.env.SESSION_SECRET || "hanna-classroom")
  );

  const res = NextResponse.json({ ok: true });
  res.cookies.set("teacher_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
