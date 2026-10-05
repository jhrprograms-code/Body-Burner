import catalog from "@/data/exercises.json";
export const exercises = catalog;
export type Exercise = (typeof catalog)[number];
export type MealName = "Breakfast" | "Lunch" | "Dinner";
export type Nutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};
export type Food = Nutrients & {
  id: string;
  name: string;
  brand?: string;
  source: string;
  sourceUrl?: string;
  basis: string;
  grams: number;
  unit?: "g" | "ml";
};
export type FoodLog = Food & { date: string; meal: MealName; entryId: string };
export type Profile = {
  name: string;
  age: number;
  sex: "male" | "female" | "other";
  height: number;
  weight: number;
  goal: "lose" | "maintain" | "build";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  days: 3 | 4 | 5;
  equipment: "gym" | "dumbbells" | "bodyweight";
  experience: "new" | "regular";
  limitations: string;
};
export type WorkoutSet = {
  id: string;
  weight: string;
  reps: string;
  rir: string;
  done: boolean;
};
export type WorkoutExercise = {
  exerciseId: string;
  sets: WorkoutSet[];
  pain: boolean;
};
export type Session = {
  id: string;
  date: string;
  name: string;
  startedAt: number;
  finishedAt?: number;
  exercises: WorkoutExercise[];
  restUntil?: number;
};
export type Measurement = {
  id: string;
  date: string;
  weight: number;
  waist?: number;
  steps?: number;
  notes: string;
};
export type Checkin = {
  id: string;
  date: string;
  sleep: number;
  energy: number;
  hunger: number;
  notes: string;
};
export type Photo = { id: string; date: string; path: string };
export type State = {
  version: 1;
  profile: Profile;
  foods: FoodLog[];
  savedFoods: Food[];
  sessions: Session[];
  active: Session | null;
  measurements: Measurement[];
  checkins: Checkin[];
  photos: Photo[];
};
export const emptyState = (): State => ({
  version: 1,
  profile: {
    name: "",
    age: 0,
    sex: "male",
    height: 0,
    weight: 0,
    goal: "lose",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    days: 3,
    equipment: "gym",
    experience: "new",
    limitations: "",
  },
  foods: [],
  savedFoods: [],
  sessions: [],
  active: null,
  measurements: [],
  checkins: [],
  photos: [],
});
export const uid = () => crypto.randomUUID();
export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function dateOffset(date: string, days: number) {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + days);
  return dayKey(d);
}
export function weekDates(date: string) {
  const d = new Date(date + "T12:00:00");
  const mon = (d.getDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => dateOffset(date, i - mon));
}
export const fmt = (n: number) =>
  new Intl.NumberFormat("en-CA", { maximumFractionDigits: 1 }).format(n);
export function totalFoods(foods: Nutrients[]): Nutrients {
  return foods.reduce(
    (a, b) => ({
      calories: a.calories + b.calories,
      protein: a.protein + b.protein,
      carbs: a.carbs + b.carbs,
      fat: a.fat + b.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
export function scaleFood(food: Food, grams: number): Food {
  if (!Number.isFinite(grams) || grams <= 0 || food.grams <= 0)
    throw new Error("Enter a positive portion.");
  const ratio = grams / food.grams;
  return {
    ...food,
    grams,
    ...Object.fromEntries(
      ["calories", "protein", "carbs", "fat"].map((k) => [
        k,
        Math.round(food[k as keyof Nutrients] * ratio * 10) / 10,
      ]),
    ),
  };
}
export type PlanDay = { name: string; focus: string; ids: string[] };
const rest: PlanDay = {
  name: "Active recovery",
  focus: "An easy walk, gentle mobility, or complete rest.",
  ids: [],
};
export function buildWeek(p: Profile): PlanDay[] {
  const upper = ["E002", "E021", "E029", "E082", "E101"];
  const lower = ["E049", "E062", "E142", "E152", "E124"];
  const fullA = ["E042", "E002", "E021", "E062", "E124"];
  const fullB = ["E049", "E082", "E029", "E072", "E101"];
  const mk = (
    name: string,
    ids: string[],
    focus = "Controlled reps. Leave 2–3 reps in reserve.",
  ): PlanDay => ({ name, focus, ids });
  let days =
    p.days === 5
      ? [
          mk("Upper body", upper),
          mk("Lower body", lower),
          rest,
          mk("Push", ["E003", "E082", "E090", "E112"]),
          mk("Pull", ["E021", "E029", "E096", "E101"]),
          mk("Legs & core", lower),
          rest,
        ]
      : p.days === 4
        ? [
            mk("Upper A", upper),
            mk("Lower A", lower),
            rest,
            mk("Upper B", ["E003", "E029", "E082", "E090", "E104"]),
            mk("Lower B", ["E042", "E062", "E142", "E152", "E124"]),
            rest,
            rest,
          ]
        : [
            mk("Full body A", fullA),
            rest,
            mk("Full body B", fullB),
            rest,
            mk("Full body A", fullA),
            rest,
            rest,
          ];
  const dumbbell: Record<string, string> = {
    E021: "E031",
    E029: "E030",
    E049: "E042",
    E142: "E072",
    E112: "E114",
  };
  const body: Record<string, string> = {
    E002: "E007",
    E003: "E006",
    E021: "E125",
    E029: "E125",
    E082: "E089",
    E101: "E125",
    E049: "E041",
    E042: "E041",
    E062: "E072",
    E142: "E073",
    E152: "E150",
    E090: "E199",
    E112: "E008",
    E096: "E125",
    E104: "E125",
  };
  days = days.map((d) => ({
    ...d,
    ids: [
      ...new Set(
        d.ids.map((id) =>
          p.equipment === "dumbbells"
            ? dumbbell[id] || id
            : p.equipment === "bodyweight"
              ? body[id] || id
              : id,
        ),
      ),
    ],
  }));
  return days;
}
export function lastExercise(sessions: Session[], id: string) {
  return [...sessions]
    .sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0))
    .flatMap((s) => s.exercises)
    .find((e) => e.exerciseId === id && e.sets.some((s) => s.done));
}
export function loadSuggestion(
  previous: WorkoutExercise | undefined,
  increment = 2.5,
) {
  if (!previous)
    return {
      weight: "",
      text: "Choose a light starting load. Aim for 8–12 smooth reps, with 2–3 left in reserve.",
    };
  const done = previous.sets.filter((s) => s.done);
  const weights = done.map((s) => Number(s.weight));
  if (
    !done.length ||
    done.some((s) => s.weight === "" || !Number.isFinite(Number(s.weight)))
  )
    return {
      weight: "",
      text: "Log your working weight to get a progression suggestion.",
    };
  const load = weights[weights.length - 1];
  if (previous.pain)
    return {
      weight: String(load),
      text: "Pain was reported. Pause this movement and review a comfortable alternative; no increase suggested.",
    };
  const increase =
    done.length === previous.sets.length &&
    done.length >= 2 &&
    done.every(
      (s) => Number(s.reps) >= 12 && s.rir !== "" && Number(s.rir) >= 2,
    ) &&
    weights.every((w) => w === load) &&
    load > 0;
  const step = Math.min(increment, Math.floor(load * 0.1 * 2) / 2);
  if (increase && step <= 0)
    return {
      weight: String(load),
      text: "All sets reached the upper range. Keep this load until a suitably small equipment increment is available; avoid a large jump.",
    };
  return {
    weight: String(load),
    text: increase
      ? `All sets reached 12 reps with room to spare. Consider ${fmt(Math.round((load + step) * 100) / 100)} kg next time, if your equipment allows and form stays comfortable.`
      : "Repeat the previous load. Build reps within 8–12 before considering an increase.",
  };
}
export function newExercise(
  id: string,
  p: Profile,
  sessions: Session[],
): WorkoutExercise {
  const previous = lastExercise(sessions, id);
  return {
    exerciseId: id,
    pain: false,
    sets: Array.from({ length: p.experience === "new" ? 2 : 3 }, () => ({
      id: uid(),
      weight: loadSuggestion(previous).weight,
      reps: "",
      rir: "",
      done: false,
    })),
  };
}
export function sessionVolume(s: Session) {
  return s.exercises.reduce(
    (sum, e) =>
      sum +
      (exercises.find((x) => x.id === e.exerciseId)?.tracking === "repetitions"
        ? e.sets
            .filter((s) => s.done)
            .reduce((a, s) => a + Number(s.weight) * Number(s.reps), 0)
        : 0),
    0,
  );
}
export function weightTrend(entries: Measurement[], date: string) {
  const mean = (a: Measurement[]) =>
    a.length ? a.reduce((s, e) => s + e.weight, 0) / a.length : null;
  const valid = entries.filter((e) => e.weight > 0 && e.date <= date);
  const current = valid.filter((e) => e.date >= dateOffset(date, -6));
  const prior = valid.filter(
    (e) => e.date >= dateOffset(date, -13) && e.date < dateOffset(date, -6),
  );
  const a = mean(current),
    b = mean(prior);
  return {
    current: a,
    previous: b,
    change:
      current.length >= 3 && prior.length >= 3 && a !== null && b !== null
        ? a - b
        : null,
  };
}
export function weeklyReview(state: State, date = dayKey()) {
  const trend = weightTrend(state.measurements, date);
  const last7 = state.sessions.filter(
    (s) => s.date >= dateOffset(date, -6) && s.date <= date,
  );
  const mealDays = new Set(
    state.foods
      .filter((f) => f.date >= dateOffset(date, -6) && f.date <= date)
      .map((f) => f.date),
  ).size;
  return {
    trend,
    sessions: last7.length,
    mealDays,
    message:
      trend.change === null
        ? "Keep collecting comparable morning weigh-ins. At least 3 weigh-ins in each of two weeks are needed for a useful trend."
        : `Your weekly average changed ${trend.change > 0 ? "+" : ""}${fmt(trend.change)} kg. Check waist, strength, hunger and logging consistency before changing your calorie target.`,
    note: "Creatine and hydration can affect scale weight. Targets stay unchanged until you choose to edit them.",
  };
}
