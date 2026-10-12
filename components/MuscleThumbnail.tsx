import type { MuscleCategoryId } from "@/lib/domain";

// The atlas is a 6 × 3 grid, ordered left-to-right then top-to-bottom.
const muscleTile: Record<MuscleCategoryId, readonly [number, number]> = {
  chest: [0, 0],
  shoulders: [1, 0],
  biceps: [2, 0],
  triceps: [3, 0],
  forearms: [4, 0],
  back: [5, 0],
  traps: [0, 1],
  neck: [1, 1],
  glutes: [2, 1],
  quadriceps: [3, 1],
  hamstrings: [4, 1],
  calves: [5, 1],
  core: [0, 2],
  hip_flexors: [2, 2],
  hip_abductors: [3, 2],
  hip_adductors: [4, 2],
  full_body: [5, 2],
};

export default function MuscleThumbnail({
  id,
  label,
}: {
  id: MuscleCategoryId;
  label: string;
}) {
  const [column, row] = muscleTile[id];

  return (
    <span className="muscle-thumbnail" role="img" aria-label={`${label} anatomy`}>
      <span
        aria-hidden="true"
        className="muscle-thumbnail-image"
        style={{ backgroundPosition: `${column * 20}% ${row * 50}%` }}
      />
    </span>
  );
}
