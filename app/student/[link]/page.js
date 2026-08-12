"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import DailyIframe from "@daily-co/daily-js";
import Whiteboard from "../../../components/Whiteboard";

export default function StudentClassroom() {
  const { link } = useParams();
  const [student, setStudent] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const containerRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("students")
        .select("*")
        .eq("link_slug", link)
        .single();
      if (!data) {
        setNotFound(true);
      } else {
        setStudent(data);
      }
    }
    if (link) load();
  }, [link]);

  useEffect(() => {
    if (!student || !containerRef.current || frameRef.current) return;
    const frame = DailyIframe.createFrame(containerRef.current, {
      showLeaveButton: false,
      iframeStyle: { width: "100%", height: "100%", border: "0" },
    });
    frameRef.current = frame;
    frame.join({ url: `https://${process.env.NEXT_PUBLIC_DAILY_DOMAIN}.daily.co/${student.daily_room_name}` });
    return () => {
      frame.destroy();
      frameRef.current = null;
    };
  }, [student]);

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 text-center">
        <p className="text-gray-600">
          This classroom link isn't recognised. Please check the link your teacher sent you.
        </p>
      </main>
    );
  }

  if (!student) {
    return <main className="min-h-screen flex items-center justify-center">Loading...</main>;
  }

  return (
    <main className="h-screen flex flex-col">
      <header className="px-4 py-3 bg-navy text-white text-center">
        <h1 className="font-medium">Welcome, {student.name}</h1>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div ref={containerRef} className="w-64 shrink-0 bg-black" />
        <div className="flex-1 relative">
          <div className="absolute inset-0">
            <Whiteboard studentId={student.id} />
          </div>
        </div>
      </div>
    </main>
  );
}
