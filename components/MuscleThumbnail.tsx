"use client";
import type { MuscleCategoryId } from "@/lib/domain";

const rear = new Set<MuscleCategoryId>(["back","traps","neck","glutes","hamstrings","calves"]);
export default function MuscleThumbnail({ id, label }: { id: MuscleCategoryId; label: string }) {
  const back = rear.has(id);
  const on = (...ids: MuscleCategoryId[]) => ids.includes(id);
  return <span className="muscle-thumbnail" role="img" aria-label={`${label} muscle illustration`}>
    <svg viewBox="0 0 72 72" aria-hidden="true">
      <circle className="anatomy-base" cx="36" cy="8.5" r="5.5"/>
      <path className="anatomy-base" d="M29 15 Q36 12 43 15 L47 37 Q43 42 41 43 L43 67 H36 L35 46 L33 67 H26 L29 43 Q24 40 25 34Z"/>
      <path className="anatomy-base" d="M28 17 L20 21 14 42 19 44 28 27M44 17 L52 21 58 42 53 44 44 27"/>
      <path className="anatomy-line" d="M36 14V44M27 27H45M29 36H43M29 44L35 46 41 44M30 52H42"/>
      {on("chest") && <path className="muscle-hot" d="M27 20Q31 16 35 19V28Q30 29 27 25ZM45 20Q41 16 37 19V28Q42 29 45 25Z"/>}
      {on("shoulders") && <path className="muscle-hot" d="M27 17Q21 17 19 22L24 27 29 22ZM45 17Q51 17 53 22L48 27 43 22Z"/>}
      {on("biceps") && <path className="muscle-hot" d="M21 23Q18 27 18 34L23 35 26 25ZM51 23Q54 27 54 34L49 35 46 25Z"/>}
      {on("triceps") && <path className="muscle-hot" d="M21 23Q17 30 17 35L22 36 26 25ZM51 23Q55 30 55 35L50 36 46 25Z"/>}
      {on("forearms") && <path className="muscle-hot" d="M17 34L13 42 19 44 23 35ZM55 34L59 42 53 44 49 35Z"/>}
      {on("back") && <path className="muscle-hot" d="M28 19Q36 25 44 19L45 34 39 40 36 35 33 40 27 34Z"/>}
      {on("traps") && <path className="muscle-hot" d="M31 14H41L46 24 36 21 26 24Z"/>}
      {on("neck") && <path className="muscle-hot" d="M32 12H40L42 17 36 19 30 17Z"/>}
      {on("glutes") && <path className="muscle-hot" d="M29 39Q35 38 35 45L30 49 26 45ZM43 39Q37 38 37 45L42 49 46 45Z"/>}
      {on("quadriceps") && <path className="muscle-hot" d="M28 46Q32 43 34 48L33 59 28 61 26 53ZM44 46Q40 43 38 48L39 59 44 61 46 53Z"/>}
      {on("hamstrings") && <path className="muscle-hot" d="M28 47Q32 44 34 48L33 59 28 60 26 52ZM44 47Q40 44 38 48L39 59 44 60 46 52Z"/>}
      {on("calves") && <path className="muscle-hot" d="M27 58Q31 55 33 59L32 67H27L25 63ZM45 58Q41 55 39 59L40 67H45L47 63Z"/>}
      {on("core") && <path className="muscle-hot" d="M29 27H43L42 40 36 44 30 40Z"/>}
      {on("hip_flexors") && <path className="muscle-hot" d="M29 38L35 42 32 50 27 47ZM43 38L37 42 40 50 45 47Z"/>}
      {on("hip_abductors") && <path className="muscle-hot" d="M27 39L32 43 29 52 25 49ZM45 39L40 43 43 52 47 49Z"/>}
      {on("hip_adductors") && <path className="muscle-hot" d="M34 43L35 47 32 57 29 53ZM38 43L37 47 40 57 43 53Z"/>}
      {on("full_body") && <path className="muscle-hot" opacity=".86" d="M30 15H42L47 36 41 44 43 67H38L36 47 34 67H27L29 44 25 36Z"/>}
      {back && <path className="anatomy-line" d="M29 18Q36 23 43 18M31 31L36 36 41 31"/>}
    </svg>
  </span>;
}
