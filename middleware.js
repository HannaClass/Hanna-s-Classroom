import { NextResponse } from "next/server";

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const protectedPaths = ["/dashboard", "/classroom"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const cookie = request.cookies.get("teacher_session")?.value;
  const expected = await sha256Hex(
    (process.env.TEACHER_PASSWORD || "") +
      (process.env.SESSION_SECRET || "hanna-classroom")
  );

  if (cookie === expected) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/classroom/:path*"],
};
