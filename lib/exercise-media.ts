export function privateExercisePath(url: string): string | null {
  const match = /^supabase:\/\/exercise-media\/(\d{4}\.mp4)$/.exec(url);
  return match?.[1] ?? null;
}
