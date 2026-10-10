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
  thumbnail = false,
}: {
  url: string;
  name: string;
  expanded?: boolean;
  thumbnail?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const storagePath = privateExercisePath(url);
  useEffect(() => {
    if ((!expanded && !thumbnail) || !storagePath) return;
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
  }, [expanded, thumbnail, storagePath, attempt]);
  if ((expanded || thumbnail) && storagePath && !signedUrl) {
    if (thumbnail)
      return (
        <span
          role="img"
          aria-label={`${name} ${message ? "thumbnail unavailable" : "thumbnail loading"}`}
        >
          <Dumbbell size={24} />
        </span>
      );
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
  }
  if (failed && expanded)
    return (
      <div role="status">
        <p>Demonstration could not play. Check your connection and retry.</p>
        <button
          className="secondary"
          onClick={() => {
            setFailed(false);
            setAttempt((n) => n + 1);
          }}
        >
          Retry demonstration
        </button>
      </div>
    );
  if (failed)
    return (
      <span role="img" aria-label={`${name} demonstration unavailable`}>
        <Dumbbell size={28} />
      </span>
    );
  const video = /\.mp4(?:[?#]|$)/i.test(url);
  if (video && !expanded && !thumbnail)
    return <Play size={24} aria-label={`Play ${name} demonstration`} />;
  return video ? (
    <video
      src={signedUrl || url}
      aria-label={`${name} ${thumbnail ? "thumbnail" : "demonstration"}`}
      muted
      loop
      playsInline
      controls={expanded}
      preload={expanded || thumbnail ? "metadata" : "none"}
      onLoadedMetadata={(event) => {
        if (thumbnail && event.currentTarget.duration > 0.1)
          event.currentTarget.currentTime = 0.1;
      }}
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
