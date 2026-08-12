"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

function slugify(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 6)
  );
}

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  async function loadStudents() {
    setLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setStudents(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadStudents();
  }, []);

  async function handleAddStudent(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setError("");

    const slug = slugify(newName);
    const roomName = `classroom-${slug}`;

    // 1. Create the permanent Daily.co room
    const roomRes = await fetch("/api/create-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomName }),
    });

    if (!roomRes.ok) {
      setError("Could not create video room. Check your Daily.co API key.");
      setAdding(false);
      return;
    }

    // 2. Save the student record
    const { error: insertError } = await supabase.from("students").insert({
      name: newName.trim(),
      link_slug: slug,
      daily_room_name: roomName,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setNewName("");
      await loadStudents();
    }
    setAdding(false);
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-navy">Your students</h1>
        <button onClick={handleLogout} className="text-sm text-gray-500 underline">
          Log out
        </button>
      </div>

      <form onSubmit={handleAddStudent} className="card mb-6 flex gap-2">
        <input
          placeholder="New student's name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" className="btn whitespace-nowrap" disabled={adding}>
          {adding ? "Adding..." : "Add student"}
        </button>
      </form>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : students.length === 0 ? (
        <p className="text-gray-500">No students yet — add your first one above.</p>
      ) : (
        <div className="space-y-2">
          {students.map((s) => (
            <div key={s.id} className="card flex justify-between items-center">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-gray-400 break-all">
                  Student link: {typeof window !== "undefined" ? window.location.origin : ""}/student/{s.link_slug}
                </p>
              </div>
              <Link href={`/classroom/${s.id}`} className="btn-secondary text-sm">
                Open classroom
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
