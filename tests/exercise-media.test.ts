import test from "node:test";
import assert from "node:assert/strict";
import { privateExercisePath } from "../lib/exercise-media";
import media from "../data/media.json";
import exercises from "../data/exercises.json";
import vitalMedia from "../data/vital-media.json";
import vitalExercises from "../data/vital-exercises.json";

test("private exercise URLs are confined to the licensed bucket and numeric MP4 IDs", () => {
  assert.equal(
    privateExercisePath("supabase://exercise-media/0042.mp4"),
    "0042.mp4",
  );
  for (const value of [
    "supabase://progress/0042.mp4",
    "supabase://exercise-media/../0042.mp4",
    "supabase://exercise-media/0042.mp4?token=x",
    "https://example.com/0042.mp4",
  ])
    assert.equal(privateExercisePath(value), null);
});

test("every purchased Vital animation has one exercise and one safe private media mapping", () => {
  const ids = new Set(vitalExercises.map((exercise) => exercise.id));
  assert.equal(vitalExercises.length, 402);
  assert.equal(ids.size, 402);
  assert.equal(Object.keys(vitalMedia).length, 402);
  for (const [id, entry] of Object.entries(vitalMedia)) {
    assert.ok(ids.has(id));
    assert.ok(privateExercisePath(entry.url));
  }
  assert.equal(vitalMedia.V0001.url, "supabase://exercise-media/0001.mp4");
  assert.equal(vitalMedia.V1208.url, "supabase://exercise-media/1208.mp4");
});
test("enabled video mappings reference known exercises and safe storage objects", () => {
  const ids = new Set(exercises.map((e) => e.id));
  assert.equal(Object.keys(media).length, 101);
  for (const [id, entry] of Object.entries(media)) {
    assert.ok(ids.has(id));
    assert.ok(privateExercisePath(entry.url));
  }
  for (const rejected of ["E014", "E091", "E092"])
    assert.ok(!(rejected in media));
});
