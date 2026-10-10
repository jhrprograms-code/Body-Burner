import test from "node:test";
import assert from "node:assert/strict";
import { emptyState } from "../lib/domain";
import {
  bmi,
  earnedBadges,
  loggingStreak,
  weightChange,
} from "../lib/wellness";
import { geminiModel, providerError } from "../lib/gemini";
test("BMI uses actual unrounded thresholds, not screenshot's incorrect healthy label", () => {
  assert.equal(bmi(99, 181)?.category, "Obesity range");
  assert.equal(bmi(29.9, 100)?.category, "Overweight");
  assert.equal(bmi(30, 100)?.category, "Obesity range");
  assert.equal(bmi(0, 181), null);
});
test("weight changes never invent missing history or include future entries", () => {
  const entries = [
    { id: "1", date: "2026-10-01", weight: 99, notes: "" },
    { id: "2", date: "2026-10-09", weight: 98, notes: "" },
    { id: "3", date: "2026-11-01", weight: 80, notes: "" },
  ];
  assert.equal(weightChange(entries, "2026-10-09", 7), -1);
  assert.equal(weightChange(entries, "2026-10-09", 30), null);
  assert.equal(weightChange([], "2026-10-09", 7), null);
});
test("streak counts unique consecutive dates across month boundaries", () => {
  assert.equal(
    loggingStreak(["2026-09-30", "2026-10-01", "2026-10-01"], "2026-10-02"),
    2,
  );
  assert.equal(loggingStreak(["2026-10-01"], "2026-10-03"), 0);
});
test("stale weigh-ins cannot be presented as recent period changes", () => {
  const entries = [
    { id: "1", date: "2026-08-15", weight: 99.8, notes: "" },
    { id: "2", date: "2026-10-09", weight: 96.8, notes: "" },
  ];
  for (const days of [3, 7, 14, 30])
    assert.equal(weightChange(entries, "2026-10-09", days), null);
});
test("badges start locked, completed workouts and recorded water earn badges", () => {
  const s = emptyState();
  assert.equal(earnedBadges(s, "2026-10-09").filter((b) => b.earned).length, 0);
  s.water = [{ id: "1", date: "2026-10-09", ml: 250 }];
  assert.equal(
    earnedBadges(s, "2026-10-09").find((b) => b.id === "water")?.earned,
    true,
  );
  assert.equal(
    earnedBadges(s, "2026-10-08").find((b) => b.id === "water")?.earned,
    false,
  );
});
test("Gemini model accepts harmless formatting, rejects credentials without exposing them", () => {
  assert.equal(
    geminiModel(" models/gemini-2.5-flash-lite\n"),
    "gemini-2.5-flash-lite",
  );
  assert.equal(geminiModel(), "gemini-2.5-flash-lite");
  assert.throws(
    () => geminiModel("SECRET-CREDENTIAL"),
    (e) => !String(e).includes("SECRET-CREDENTIAL"),
  );
  assert.match(providerError(404), /not available/);
  assert.match(providerError(429), /limit/);
});
