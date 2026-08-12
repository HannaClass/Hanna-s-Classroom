"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import DailyIframe from "@daily-co/daily-js";
import Whiteboard from "../../../components/Whiteboard";

export default function Classroom() {
  const { studentId } = useParams();
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [materials, setMaterials] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [docUrl, setDocUrl] = useState("");
  const [savingDoc, setSavingDoc] = useState(false);
  const [tab, setTab] = useState("whiteboard"); // whiteboard | docs | materials | notes

  const callFrameRef = useRef(null);
  const videoContainerRef = useRef(null);

  // --- Load student + related data ---
  useEffect(() => {
    async function load() {
      const { data: s } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();
      if (!s) return;
      setStudent(s);
      setDocUrl(s.google_doc_url || "");

      const { data: n } = await supabase
        .from("lesson_notes")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      setNotes(n || []);

      const { data: m } = await supabase
        .from("uploaded_materials")
        .select("*")
        .eq("student_id", studentId)
        .order("uploaded_at", { ascending: false });
      setMaterials(m || []);
    }
    if (studentId) load();
  }, [studentId]);

  // --- Video call ---
  useEffect(() => {
    if (!student || !videoContainerRef.current || callFrameRef.current) return;

    const frame = DailyIframe.createFrame(videoContainerRef.current, {
      showLeaveButton: false,
      iframeStyle: {
        width: "100%",
        height: "100%",
        border: "0",
        borderRadius: "8px",
      },
    });
    callFrameRef.current = frame;
    frame.join({ url: `https://${process.env.NEXT_PUBLIC_DAILY_DOMAIN}.daily.co/${student.daily_room_name}` });

    return () => {
      frame.destroy();
      callFrameRef.current = null;
    };
  }, [student]);

  // --- Google Doc link ---
  async function saveDocUrl() {
    setSavingDoc(true);
    await supabase.from("students").update({ google_doc_url: docUrl }).eq("id", studentId);
    setSavingDoc(false);
  }

  // --- Notes ---
  async function addNote(e) {
    e.preventDefault();
    if (!newNote.trim()) return;
    const { data } = await supabase
      .from("lesson_notes")
      .insert({ student_id: studentId, content: newNote.trim() })
      .select()
      .single();
    setNotes([data, ...notes]);
    setNewNote("");
  }

  // --- Materials upload ---
  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const path = `${studentId}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("materials").upload(path, file);
    if (upErr) {
      alert("Upload failed: " + upErr.message);
      setUploading(false);
      return;
    }
    const { data: publicUrl } = supabase.storage.from("materials").getPublicUrl(path);

    const { data } = await supabase
      .from("uploaded_materials")
      .insert({
        student_id: studentId,
        file_name: file.name,
        file_url: publicUrl.publicUrl,
      })
      .select()
      .single();

    setMaterials([data, ...materials]);
    setUploading(false);
  }

  if (!student) {
    return <main className="p-6">Loading classroom...</main>;
  }

  return (
    <main className="h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-2 bg-navy text-white">
        <button onClick={() => router.push("/dashboard")} className="text-sm underline">
          ← All students
        </button>
        <h1 className="font-semibold">{student.name}'s classroom</h1>
        <div className="w-24" />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: video call, stacked above the whiteboard tools */}
        <div className="w-72 shrink-0 border-r border-gray-200 flex flex-col">
          <div ref={videoContainerRef} className="h-48 bg-black" />
          <nav className="flex flex-col p-2 gap-1">
            {[
              ["whiteboard", "Whiteboard"],
              ["docs", "Google Doc"],
              ["materials", "Materials"],
              ["notes", "Lesson notes"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`text-left px-3 py-2 rounded-md text-sm ${
                  tab === key ? "bg-navy text-white" : "hover:bg-gray-100"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: whichever tool is active */}
        <div className="flex-1 relative">
          {tab === "whiteboard" && (
            <div className="absolute inset-0">
              <Whiteboard studentId={studentId} />
            </div>
          )}

          {tab === "docs" && (
            <div className="p-4 h-full flex flex-col">
              <div className="flex gap-2 mb-3">
                <input
                  placeholder="Paste this student's Google Doc link"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                />
                <button onClick={saveDocUrl} className="btn whitespace-nowrap" disabled={savingDoc}>
                  {savingDoc ? "Saving..." : "Save"}
                </button>
              </div>
              {docUrl ? (
                <iframe src={docUrl} className="flex-1 w-full border rounded-md" title="Google Doc" />
              ) : (
                <p className="text-gray-500 text-sm">
                  Add this student's Google Doc link above — you'll always find it here for this classroom, and it stays live during the call.
                </p>
              )}
            </div>
          )}

          {tab === "materials" && (
            <div className="p-4">
              <label className="btn inline-block cursor-pointer mb-4">
                {uploading ? "Uploading..." : "Upload PDF, PPT or image"}
                <input type="file" onChange={handleUpload} className="hidden" disabled={uploading} />
              </label>
              <div className="space-y-2">
                {materials.length === 0 && (
                  <p className="text-gray-500 text-sm">No materials uploaded yet for this student.</p>
                )}
                {materials.map((m) => (
                  <a
                    key={m.id}
                    href={m.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="card block hover:bg-gray-50"
                  >
                    {m.file_name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {tab === "notes" && (
            <div className="p-4 h-full flex flex-col">
              <form onSubmit={addNote} className="mb-4 space-y-2">
                <textarea
                  rows={3}
                  placeholder="Corrections, vocabulary, things to revisit next time..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <button type="submit" className="btn">
                  Add note
                </button>
              </form>
              <div className="space-y-2 overflow-y-auto flex-1">
                {notes.map((n) => (
                  <div key={n.id} className="card">
                    <p className="text-xs text-gray-400 mb-1">
                      {new Date(n.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
