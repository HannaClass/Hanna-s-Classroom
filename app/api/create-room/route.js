import { NextResponse } from "next/server";

// Creates a permanent Daily.co room for a student (called once, when the
// student is first added). Reuses the room on every future lesson.
export async function POST(request) {
  const { roomName } = await request.json();

  if (!roomName) {
    return NextResponse.json({ error: "roomName required" }, { status: 400 });
  }

  const res = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: roomName,
      privacy: "public", // room is unguessable by name; link itself is the access control
      properties: {
        enable_screenshare: true,
        enable_chat: true,
        enable_knocking: false,
        exp: null, // no expiry — this is a permanent classroom
      },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    // If the room already exists, that's fine — just reuse it.
    if (data?.error === "invalid-request-error" && data?.info?.includes("already exists")) {
      return NextResponse.json({ ok: true, existing: true });
    }
    return NextResponse.json({ error: data }, { status: res.status });
  }

  return NextResponse.json({ ok: true, room: data });
}
