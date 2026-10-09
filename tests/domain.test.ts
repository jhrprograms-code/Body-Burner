import test from "node:test";
import assert from "node:assert/strict";
import {
  buildWeek,
  emptyState,
  exercises,
  loadSuggestion,
  movePlanDay,
  orderPlan,
  scaleFood,
  sessionVolume,
  totalFoods,
  weightTrend,
  weekDates,
  type Food,
  type Session,
  type WorkoutExercise,
} from "../lib/domain";
import { offFood, usdaFood } from "../lib/food";
const food: Food = {
  id: "f",
  name: "Food",
  source: "test",
  basis: "100 g",
  grams: 100,
  calories: 120,
  protein: 20,
  carbs: 4,
  fat: 3,
};
const sets = (overrides: Record<string, unknown> = {}): WorkoutExercise => ({
  exerciseId: "E002",
  pain: false,
  sets: [1, 2, 3].map((i) => ({
    id: String(i),
    weight: "20",
    reps: "12",
    rir: "2",
    done: true,
    ...overrides,
  })),
});
test("portion scaling uses the source portion and preserves zero macros", () => {
  const x = scaleFood({ ...food, fat: 0 }, 250);
  assert.equal(x.calories, 300);
  assert.equal(x.protein, 50);
  assert.equal(x.fat, 0);
  assert.equal(x.grams, 250);
  assert.equal(food.calories, 120);
});
test("invalid portion cannot produce negative or infinite nutrition", () => {
  for (const n of [-1, 0, NaN, Infinity])
    assert.throws(() => scaleFood(food, n));
  assert.throws(() => scaleFood({ ...food, grams: 0 }, 100));
});
test("empty meal totals are real zeros", () =>
  assert.deepEqual(totalFoods([]), {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  }));
test("new lifter gets calibration instead of an invented weight", () =>
  assert.equal(loadSuggestion(undefined).weight, ""));
test("full successful sets suggest a small increment without changing entered weight", () => {
  const x = loadSuggestion(sets());
  assert.equal(x.weight, "20");
  assert.match(x.text, /22 lb/);
});
test("failure, unknown effort and incomplete sessions never trigger increase", () => {
  for (const s of [
    sets({ rir: "" }),
    sets({ rir: "0" }),
    sets({ reps: "8" }),
    sets({ done: false }),
  ])
    assert.doesNotMatch(loadSuggestion(s).text, /Consider/);
  const partial = sets();
  partial.sets[2].done = false;
  assert.doesNotMatch(loadSuggestion(partial).text, /Consider/);
});
test("pain and different working weights block automatic increase", () => {
  assert.match(loadSuggestion({ ...sets(), pain: true }).text, /Pause/);
  const mixed = sets();
  mixed.sets[1].weight = "15";
  assert.doesNotMatch(loadSuggestion(mixed).text, /Consider/);
});
test("blank and bodyweight loads are not treated as a calibrated barbell load", () => {
  assert.equal(loadSuggestion(sets({ weight: "" })).weight, "");
  assert.doesNotMatch(loadSuggestion(sets({ weight: "0" })).text, /Consider/);
});
test("plan has six 80–90 minute gym days and one recovery day", () => {
  const week = buildWeek(emptyState().profile);
  assert.equal(week.length, 7);
  assert.deepEqual(
    week.map((day) => day.name),
    [
      "Push A",
      "Pull A",
      "Legs A",
      "Push B",
      "Pull B",
      "Legs B",
      "Recovery day",
    ],
  );
  const training = week.filter((day) => day.ids.length);
  assert.equal(training.length, 6);
  assert.ok(training.every((day) => day.duration === "80–90 min"));
  assert.equal(week[6].duration, null);
  for (const id of week.flatMap((day) => day.ids))
    assert.ok(exercises.some((exercise) => exercise.id === id));
});
test("every generated workout exercise has licensed thumbnail and video media", async () => {
  const media = {
    ...(await import("../data/media.json", { with: { type: "json" } })).default,
    ...(await import("../data/vital-media.json", { with: { type: "json" } })).default,
  } as Record<string, unknown>;
  for (const equipment of ["gym", "dumbbells", "bodyweight"] as const) {
    const week = buildWeek({ ...emptyState().profile, equipment });
    for (const id of week.flatMap((day) => day.ids))
      assert.ok(media[id], `${equipment} plan exercise ${id} needs media`);
  }
});
test("moving Friday to Sunday swaps the complete plans and keeps one recovery day", () => {
  const base = buildWeek(emptyState().profile);
  const order = movePlanDay([0, 1, 2, 3, 4, 5, 6], 4, 6);
  const moved = orderPlan(base, order);
  assert.equal(moved[6].name, "Pull B");
  assert.equal(moved[4].name, "Recovery day");
  assert.equal(moved.filter((day) => !day.ids.length).length, 1);
  assert.deepEqual(movePlanDay([0, 0], 4, 6), [0, 1, 2, 3, 6, 5, 4]);
});
test("dumbbell substitution removes machine and cable movements from starter plan", () => {
  const ids = buildWeek({
    ...emptyState().profile,
    equipment: "dumbbells",
  }).flatMap((d) => d.ids);
  for (const id of [
    "E021",
    "E029",
    "E049",
    "E084",
    "E091",
    "E112",
    "E113",
    "E128",
    "E141",
    "E142",
    "E143",
    "E154",
  ])
    assert.ok(!ids.includes(id));
});
test("weight trend needs enough observations in both comparable weeks", () => {
  const items = [0, 1, 2, 7, 8, 9].map((d, i) => ({
    id: String(i),
    date: `2026-10-${String(14 - d).padStart(2, "0")}`,
    weight: i < 3 ? 98 : 99,
    notes: "",
  }));
  assert.equal(weightTrend(items, "2026-10-14").change, -1);
  assert.equal(weightTrend(items.slice(0, 4), "2026-10-14").change, null);
  assert.equal(
    weightTrend(
      [...items, { id: "f", date: "2026-10-20", weight: 50, notes: "" }],
      "2026-10-14",
    ).change,
    -1,
  );
});
test("volume ignores uncompleted sets and timed activities", () => {
  const s: Session = {
    id: "s",
    date: "2026-01-01",
    name: "Test",
    startedAt: 0,
    exercises: [sets(), { ...sets(), exerciseId: "E161" }],
  };
  s.exercises[0].sets[2].done = false;
  assert.equal(sessionVolume(s), 480);
});
test("week boundaries work across months and Sunday", () => {
  assert.deepEqual(weekDates("2026-11-01"), [
    "2026-10-26",
    "2026-10-27",
    "2026-10-28",
    "2026-10-29",
    "2026-10-30",
    "2026-10-31",
    "2026-11-01",
  ]);
});
test("OFF missing nutrients stay missing rather than become zero", () =>
  assert.equal(
    offFood({
      code: "1",
      product_name: "Incomplete",
      nutriments: { "energy-kcal_100g": 200 },
    }),
    null,
  ));
test("OFF genuine zero nutrients are retained", () => {
  const x = offFood({
    code: "123",
    product_name: "Example",
    nutriments: {
      "energy-kcal_100g": 0,
      proteins_100g: 0,
      carbohydrates_100g: 0,
      fat_100g: 0,
    },
  });
  assert.ok(x);
  assert.equal(x.calories, 0);
});
test("OFF kJ is converted only when the energy unit is known", () => {
  const p = {
    code: "1",
    product_name: "Test",
    nutriments: {
      energy_100g: 418.4,
      energy_unit: "kJ",
      proteins_100g: 0,
      carbohydrates_100g: 25,
      fat_100g: 0,
    },
  };
  assert.equal(Math.round(offFood(p)!.calories), 100);
  assert.equal(
    offFood({ ...p, nutriments: { ...p.nutriments, energy_unit: "unknown" } }),
    null,
  );
});
test("USDA uses nutrient IDs and kcal units, not nutrient ordering", () => {
  const p = {
    fdcId: 1,
    description: "Test",
    foodNutrients: [
      { nutrientId: 1004, value: 2 },
      { nutrientId: 1003, value: 8 },
      { nutrientId: 1008, value: 80, unitName: "KCAL" },
      { nutrientId: 1005, value: 10 },
    ],
  };
  assert.equal(usdaFood(p)?.protein, 8);
  assert.equal(usdaFood(p)?.calories, 80);
  assert.equal(
    usdaFood({
      ...p,
      foodNutrients: p.foodNutrients.filter((n) => n.nutrientId !== 1008),
    }),
    null,
  );
});
test("liquids keep a millilitre basis instead of silently being labelled grams", () => {
  const p = {
    code: "123",
    product_name: "Milk",
    product_quantity_unit: "ml",
    nutriments: {
      "energy-kcal_100g": 50,
      proteins_100g: 3,
      carbohydrates_100g: 5,
      fat_100g: 2,
    },
  };
  const f = offFood(p)!;
  assert.equal(f.unit, "ml");
  assert.match(f.basis, /100 ml/);
  assert.equal(scaleFood(f, 350).calories, 175);
  assert.equal(scaleFood(f, 350).unit, "ml");
});

test("light isolation loads never receive an outsized fixed increase", () => {
  assert.match(loadSuggestion(sets({ weight: "5" })).text, /5.5 lb/);
  assert.doesNotMatch(loadSuggestion(sets({ weight: "2" })).text, /Consider/);
});
