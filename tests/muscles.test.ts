import test from "node:test";
import assert from "node:assert/strict";
import {
  exerciseMuscleCategories,
  exercises,
  targetMuscleBreakdown,
} from "../lib/domain";

test("chest category includes chest exercises and excludes leg exercises", () => {
  const bench = exercises.find((exercise) => exercise.id === "E001")!;
  const squat = exercises.find((exercise) => exercise.id === "E043")!;
  assert.ok(exerciseMuscleCategories(bench).includes("chest"));
  assert.ok(!exerciseMuscleCategories(squat).includes("chest"));
});

test("front and general deltoid tags share the shoulders category", () => {
  const bench = exercises.find((exercise) => exercise.id === "E001")!;
  assert.ok(exerciseMuscleCategories(bench).includes("shoulders"));
});

test("training-day emphasis returns four ranked shares totalling 100", () => {
  const result = targetMuscleBreakdown([
    "E001",
    "E003",
    "E082",
    "E015",
    "E090",
    "E112",
    "E124",
  ]);
  assert.equal(result.length, 4);
  assert.equal(
    result.reduce((sum, item) => sum + item.percentage, 0),
    100,
  );
  assert.ok(result[0].count >= result[1].count);
});
