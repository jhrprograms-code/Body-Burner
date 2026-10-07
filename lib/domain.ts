import catalog from "@/data/exercises.json";
import vitalCatalog from "@/data/vital-exercises.json";
export const libraryExercises = vitalCatalog;
export const exercises = [...catalog, ...vitalCatalog];
export type Exercise = (typeof exercises)[number];
export const MUSCLE_CATEGORIES = [
  { id: "chest", label: "Chest", tags: ["chest"] },
  {
    id: "shoulders",
    label: "Shoulders",
    tags: ["deltoids", "front_deltoids", "rear_deltoids"],
  },
  { id: "biceps", label: "Biceps", tags: ["biceps"] },
  { id: "triceps", label: "Triceps", tags: ["triceps"] },
  { id: "forearms", label: "Forearms", tags: ["forearms"] },
  { id: "back", label: "Back", tags: ["back"] },
  { id: "traps", label: "Traps", tags: ["traps"] },
  { id: "neck", label: "Neck", tags: ["neck"] },
  { id: "glutes", label: "Glutes", tags: ["glutes"] },
  { id: "quadriceps", label: "Quadriceps", tags: ["quadriceps"] },
  { id: "hamstrings", label: "Hamstrings", tags: ["hamstrings"] },
  {
    id: "calves",
    label: "Calves & shins",
    tags: ["calves", "tibialis_anterior"],
  },
  { id: "core", label: "Core & abs", tags: ["abdominals", "trunk"] },
  { id: "hip_flexors", label: "Hip flexors", tags: ["hip_flexors"] },
  { id: "hip_abductors", label: "Hip abductors", tags: ["hip_abductors"] },
  { id: "hip_adductors", label: "Hip adductors", tags: ["hip_adductors"] },
  { id: "full_body", label: "Full body", tags: ["whole_body", "varies"] },
] as const;
export type MuscleCategoryId = (typeof MUSCLE_CATEGORIES)[number]["id"];

export function muscleCategoryForTag(tag: string) {
  return MUSCLE_CATEGORIES.find((category) =>
    (category.tags as readonly string[]).includes(tag),
  );
}

export function exerciseMuscleCategories(exercise: Pick<Exercise, "muscles">) {
  return [
    ...new Set(
      exercise.muscles
        .map((tag) => muscleCategoryForTag(tag)?.id)
        .filter((id): id is MuscleCategoryId => Boolean(id)),
    ),
  ];
}

export function targetMuscleBreakdown(ids: string[]) {
  const counts = new Map<MuscleCategoryId, number>();
  ids.forEach((id) => {
    const exercise = exercises.find((item) => item.id === id);
    if (!exercise) return;
    exerciseMuscleCategories(exercise).forEach((category) =>
      counts.set(category, (counts.get(category) || 0) + 1),
    );
  });
  const top = [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id, count]) => ({
      id,
      count,
      label: MUSCLE_CATEGORIES.find((category) => category.id === id)!.label,
    }));
  const total = top.reduce((sum, item) => sum + item.count, 0);
  if (!total) return [];
  const shares = top.map((item) => (item.count / total) * 100);
  const percentages = shares.map(Math.floor);
  let remainder = 100 - percentages.reduce((sum, value) => sum + value, 0);
  shares
    .map((share, index) => ({ index, fraction: share - percentages[index] }))
    .sort((a, b) => b.fraction - a.fraction)
    .forEach(({ index }) => {
      if (remainder > 0) {
        percentages[index] += 1;
        remainder -= 1;
      }
    });
  return top.map((item, index) => ({
    ...item,
    percentage: percentages[index],
  }));
}
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
  days: 6;
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
    days: 6,
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
export const WORKOUT_DURATION = "80–90 min";
export type PlanDay = {
  name: string;
  focus: string;
  ids: string[];
  duration: typeof WORKOUT_DURATION | null;
};
const rest: PlanDay = {
  name: "Recovery day",
  focus: "Complete rest, or an easy walk and gentle mobility if comfortable.",
  ids: [],
  duration: null,
};
export function buildWeek(p: Profile): PlanDay[] {
  const mk = (
    name: string,
    ids: string[],
    focus = "Controlled reps. Leave 2–3 reps in reserve; stop for pain.",
  ): PlanDay => ({ name, focus, ids, duration: WORKOUT_DURATION });
  let days = [
    mk("Push A", ["E001", "E003", "E082", "E015", "E090", "E112", "E124"]),
    mk("Pull A", ["E021", "E029", "E032", "E039", "E096", "E101", "E137"]),
    mk("Legs A", ["E043", "E061", "E049", "E142", "E152", "E154", "E124"]),
    mk("Push B", ["E002", "E004", "E084", "E017", "E091", "E113", "E128"]),
    mk("Pull B", ["E025", "E035", "E034", "E037", "E097", "E103", "E138"]),
    mk("Legs B", ["E044", "E070", "E055", "E141", "E143", "E149", "E127"]),
    rest,
  ];
  const dumbbell: Record<string, string> = {
    E001: "E002",
    E004: "E003",
    E021: "E031",
    E029: "E030",
    E032: "E038",
    E039: "E096",
    E043: "E042",
    E044: "E045",
    E049: "E042",
    E061: "E062",
    E070: "E071",
    E084: "E082",
    E091: "E090",
    E097: "E096",
    E103: "E101",
    E113: "E114",
    E128: "E129",
    E141: "E060",
    E142: "E072",
    E143: "E067",
    E149: "E152",
    E154: "E156",
    E127: "E124",
    E025: "E031",
    E035: "E030",
    E034: "E031",
    E037: "E038",
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
    E001: "E006",
    E004: "E007",
    E015: "E009",
    E017: "E006",
    E025: "E033",
    E032: "E033",
    E034: "E033",
    E035: "E033",
    E037: "E125",
    E039: "E125",
    E043: "E041",
    E044: "E051",
    E055: "E054",
    E061: "E067",
    E070: "E072",
    E084: "E089",
    E091: "E093",
    E097: "E125",
    E103: "E101",
    E113: "E010",
    E127: "E129",
    E128: "E129",
    E137: "E140",
    E138: "E140",
    E141: "E060",
    E143: "E147",
    E149: "E150",
    E154: "E156",
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
