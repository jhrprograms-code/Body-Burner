#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const sourcePaths = process.argv.slice(2);
if (sourcePaths.length !== 3) {
  throw new Error(
    "Usage: node scripts/build-vital-catalog.mjs <100-gym.json> <200.json> <100.json>",
  );
}

const records = sourcePaths.flatMap((path) =>
  JSON.parse(readFileSync(resolve(path), "utf8")),
);
// The supplier's first JSON has one blank ID between 0027 and 0029. The
// matching uploaded file and the previously reviewed catalogue identify it as
// 0028 (barbell bent-over row).
const blankIdRecords = records.filter((record) => record.id === "");
if (
  blankIdRecords.length === 1 &&
  blankIdRecords[0].name === "barbell bent over row" &&
  !records.some((record) => record.id === "0028")
) {
  blankIdRecords[0].id = "0028";
}
const titleCase = (value) =>
  value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

const muscleMap = {
  abs: ["abdominals"],
  adductors: ["hip_adductors"],
  back: ["back"],
  biceps: ["biceps"],
  brachialis: ["biceps"],
  calves: ["calves"],
  cardio: ["whole_body"],
  chest: ["chest"],
  core: ["abdominals", "trunk"],
  delts: ["deltoids"],
  forearms: ["forearms"],
  "front delts": ["deltoids"],
  glutes: ["glutes"],
  hamstrings: ["hamstrings"],
  "hip flexors": ["hip_flexors"],
  "lateral delts": ["deltoids"],
  lats: ["back"],
  "lower arms": ["forearms"],
  "lower back": ["back"],
  "lower chest": ["chest"],
  "lower legs": ["calves"],
  "middle traps": ["traps"],
  neck: ["neck"],
  obliques: ["trunk"],
  pectorals: ["chest"],
  quads: ["quadriceps"],
  "rear delts": ["deltoids"],
  rhomboids: ["back"],
  "rotator cuff": ["deltoids"],
  shoulders: ["deltoids"],
  soleus: ["calves"],
  supraspinatus: ["deltoids"],
  "teres major": ["back"],
  traps: ["traps"],
  triceps: ["triceps"],
  "upper arms": ["biceps", "triceps"],
  "upper back": ["back"],
  "upper legs": ["quadriceps", "hamstrings", "glutes"],
  "upper traps": ["traps"],
};

function musclesFor(record) {
  const terms = [record.target, ...record.secondaryMuscles];
  const unknown = terms.filter((term) => !muscleMap[term]);
  if (unknown.length)
    throw new Error(`${record.id}: unmapped muscles ${unknown.join(", ")}`);
  return [...new Set(terms.flatMap((term) => muscleMap[term]))];
}

function groupFor(record) {
  if (["cardio", "plyometrics"].includes(record.category))
    return "conditioning";
  if (
    ["balance", "mobility", "rehabilitation", "stretching"].includes(
      record.category,
    )
  )
    return "mobility";
  if (record.bodyPart === "chest") return "horizontal_push";
  if (record.bodyPart === "back")
    return /pull.?up|pull.?down|chin.?up/i.test(record.name)
      ? "vertical_pull"
      : "horizontal_pull";
  if (record.bodyPart === "shoulders") return "vertical_push";
  if (record.bodyPart === "upper arms") return "arm_isolation";
  if (record.bodyPart === "lower arms") return "grip";
  if (record.bodyPart === "waist") return "core";
  if (record.bodyPart === "lower legs") return "calf_ankle";
  if (record.bodyPart === "neck") return "mobility";
  if (record.bodyPart === "upper legs")
    return /deadlift|hip thrust|glute|hamstring|leg curl|good morning/i.test(
      record.name,
    )
      ? "hip_hinge"
      : "squat_lunge";
  if (record.bodyPart === "cardio") return "conditioning";
  throw new Error(`${record.id}: unmapped body part ${record.bodyPart}`);
}

function trackingFor(category) {
  if (category === "cardio") return "minutes";
  if (
    ["balance", "mobility", "rehabilitation", "stretching"].includes(category)
  )
    return "seconds";
  return "repetitions";
}

function equipmentFor(value) {
  const normalized = value.replaceAll(" ", "_");
  return normalized === "band" ? "resistance_band" : normalized;
}

const ids = records.map((record) => record.id);
if (records.length !== 402 || new Set(ids).size !== 402) {
  throw new Error(
    `Expected 402 unique supplier records, received ${records.length} records and ${new Set(ids).size} IDs.`,
  );
}
for (const record of records) {
  if (!/^\d{4}$/.test(record.id))
    throw new Error(`Invalid supplier ID ${record.id}`);
  if (!record.name || !record.instructions?.length)
    throw new Error(`${record.id}: missing name or instructions`);
}

const exercises = records
  .map((record) => ({
    id: `V${record.id}`,
    name: titleCase(record.name),
    group: groupFor(record),
    muscles: musclesFor(record),
    equipment: [equipmentFor(record.equipment)],
    tracking: trackingFor(record.category),
    cues: record.instructions,
  }))
  .sort((a, b) => a.id.localeCompare(b.id));

const media = Object.fromEntries(
  records
    .toSorted((a, b) => a.id.localeCompare(b.id))
    .map((record) => [
      `V${record.id}`,
      {
        url: `supabase://exercise-media/${record.id}.mp4`,
        provider: "Vital Animations",
        license: "Owner-purchased licence; private in-app display",
        review: "Supplier metadata matched to the animation by provider ID",
      },
    ]),
);

writeFileSync(
  "data/vital-exercises.json",
  `${JSON.stringify(exercises, null, 2)}\n`,
);
writeFileSync("data/vital-media.json", `${JSON.stringify(media, null, 2)}\n`);
console.log(
  `Generated ${exercises.length} exercises and ${Object.keys(media).length} media mappings.`,
);
