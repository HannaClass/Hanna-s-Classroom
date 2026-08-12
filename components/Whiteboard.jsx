"use client";

import { useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { supabase } from "../lib/supabaseClient";

const Tldraw = dynamic(() => import("tldraw").then((m) => m.Tldraw), { ssr: false });

// A whiteboard tied to one student's classroom. Both the teacher's page and
// the student's page render this component pointed at the same studentId,
// so they're looking at (and can both draw on) the same board.
//
// Sync approach, kept deliberately simple: every change autosaves to
// Supabase after a short pause, and a Realtime subscription applies the
// other person's saves as they land. This isn't true live cursor-by-cursor
// collaboration (that needs a dedicated sync server) but for 1-to-1 lessons
// — where you're mostly taking turns writing rather than drawing at the
// exact same instant — a ~1-2 second catch-up is unnoticeable in practice.
export default function Whiteboard({ studentId }) {
  const editorRef = useRef(null);
  const saveTimeout = useRef(null);
  const applyingRemote = useRef(false);
  const lastSavedAt = useRef(0);

  const handleMount = useCallback(
    async (editor) => {
      editorRef.current = editor;

      const { data } = await supabase
        .from("classroom_boards")
        .select("board_data, updated_at")
        .eq("student_id", studentId)
        .single();

      if (data?.board_data) {
        applyingRemote.current = true;
        try {
          editor.store.loadSnapshot(data.board_data);
        } catch (e) {
          console.error("Could not load saved board", e);
        }
        applyingRemote.current = false;
        lastSavedAt.current = data.updated_at ? new Date(data.updated_at).getTime() : 0;
      }

      // Save this side's own changes
      editor.store.listen(
        () => {
          if (applyingRemote.current) return;
          clearTimeout(saveTimeout.current);
          saveTimeout.current = setTimeout(async () => {
            const snapshot = editor.store.getSnapshot();
            const now = new Date().toISOString();
            lastSavedAt.current = Date.now();
            await supabase.from("classroom_boards").upsert({
              student_id: studentId,
              board_data: snapshot,
              updated_at: now,
            });
          }, 1200);
        },
        { source: "user", scope: "document" }
      );

      // Pick up the other side's changes
      const channel = supabase
        .channel(`board-${studentId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "classroom_boards",
            filter: `student_id=eq.${studentId}`,
          },
          (payload) => {
            const updatedAt = new Date(payload.new.updated_at).getTime();
            // Skip updates that were just our own save landing back
            if (updatedAt - lastSavedAt.current < 1000) return;
            applyingRemote.current = true;
            try {
              editor.store.loadSnapshot(payload.new.board_data);
            } catch (e) {
              console.error("Could not apply incoming board update", e);
            }
            applyingRemote.current = false;
          }
        )
        .subscribe();

      editor.disposables?.push?.(() => supabase.removeChannel(channel));
    },
    [studentId]
  );

  return <Tldraw onMount={handleMount} />;
}
