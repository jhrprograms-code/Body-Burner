"use client";

import Image from "next/image";
import { useState } from "react";
import { Dumbbell, Play } from "lucide-react";

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
      src={url}
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
