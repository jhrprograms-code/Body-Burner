"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Dumbbell, Play } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { privateExercisePath } from "@/lib/exercise-media";

/** Media URLs must come from the reviewed, licensed exercise manifest. */
export default function ExerciseMedia({
  url,
  name,
  expanded = false,
}: {
  url: string;
  name: string;
  expanded?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const storagePath = privateExercisePath(url);
  useEffect(() => {
    if (!expanded || !storagePath) return;
    let cancelled = false;
    setSignedUrl(null);
    setMessage("");
    setFailed(false);
    async function resolve() {
      if (!supabase) {
        setMessage("Online video playback is not configured yet.");
        return;
      }
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!session) {
          setMessage(
            "Sign in through Settings to watch licensed demonstrations.",
          );
          return;
        }
        const { data, error } = await supabase.storage
          .from("exercise-media")
          .createSignedUrl(storagePath!, 3600);
        if (cancelled) return;
        if (error || !data?.signedUrl) {
          setMessage(
            "Video access could not be verified. Sign out, sign in again, and retry.",
          );
          return;
        }
        setSignedUrl(data.signedUrl);
      } catch {
        if (!cancelled)
          setMessage(
            "Could not load the video. Check your connection and try again.",
          );
      }
    }
    void resolve();
    const timer = setTimeout(() => setAttempt((n) => n + 1), 55 * 60 * 1000);
    const subscription = supabase?.auth.onAuthStateChange((event) => {
      if (event === "INITIAL_SESSION") return;
      setSignedUrl(null);
      setAttempt((n) => n + 1);
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
      subscription?.data.subscription.unsubscribe();
    };
  }, [expanded, storagePath, attempt]);
  if (expanded && storagePath && !signedUrl)
    return (
      <div role="status">
        <p>{message || "Loading demonstration…"}</p>
        {message && (
          <button
            className="secondary"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Try again
          </button>
        )}
      </div>
    );
  if (failed)
    return (
      <span role="img" aria-label={`${name} demonstration unavailable`}>
        <Dumbbell size={28} />
      </span>
    );
  const video = /\.mp4(?:[?#]|$)/i.test(url);
  if (video && !expanded)
    return <Play size={24} aria-label={`Play ${name} demonstration`} />;
  return video ? (
    <video
      src={signedUrl || url}
      aria-label={`${name} demonstration`}
      muted
      loop
      playsInline
      controls={expanded}
      preload={expanded ? "metadata" : "none"}
      onError={() => setFailed(true)}
    >
      Your browser cannot play this demonstration.
    </video>
  ) : (
    <Image
      src={url}
      alt={`${name} demonstration`}
      width={expanded ? 640 : 51}
      height={expanded ? 640 : 51}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
