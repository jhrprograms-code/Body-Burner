import { dateOffset, type State, type Measurement } from "./domain";

export function bmi(weight: number, height: number) {
  if (
    !Number.isFinite(weight) ||
    !Number.isFinite(height) ||
    weight <= 0 ||
    height <= 0
  )
    return null;
  const value = weight / (height / 100) ** 2;
  return {
    value,
    category:
      value < 18.5
        ? "Underweight"
        : value < 25
          ? "Healthy range"
          : value < 30
            ? "Overweight"
            : "Obesity range",
  };
}

export function weightChange(
  entries: Measurement[],
  date: string,
  days: number,
) {
  const sorted = entries
    .filter((x) => x.date <= date)
    .sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted.at(-1);
  if (!latest) return null;
  const baseline = sorted
    .filter((x) => x.date <= dateOffset(latest.date, -days))
    .at(-1);
  return baseline ? latest.weight - baseline.weight : null;
}

export function loggingStreak(dates: string[], today: string) {
  const unique = new Set(dates.filter((d) => d <= today));
  let cursor = unique.has(today) ? today : dateOffset(today, -1),
    count = 0;
  while (unique.has(cursor)) {
    count++;
    cursor = dateOffset(cursor, -1);
  }
  return count;
}

export function earnedBadges(state: State, today: string) {
  const foodDates = [
    ...new Set(state.foods.filter((f) => f.date <= today).map((f) => f.date)),
  ];
  const completeDays = foodDates.filter(
    (date) =>
      new Set(state.foods.filter((f) => f.date === date).map((f) => f.meal))
        .size === 3,
  ).length;
  const workouts = state.sessions.filter(
    (s) => s.finishedAt && s.date <= today,
  ).length;
  const waterDates = [
    ...new Set(
      (state.water || [])
        .filter((w) => w.date <= today && w.ml > 0)
        .map((w) => w.date),
    ),
  ];
  const definitions = [
    {
      id: "first",
      icon: "🍽️",
      title: "First plate",
      detail: "Log your first food",
      value: foodDates.length,
      target: 1,
    },
    {
      id: "seven",
      icon: "🔥",
      title: "Building rhythm",
      detail: "Log food on 7 days",
      value: foodDates.length,
      target: 7,
    },
    {
      id: "thirty",
      icon: "🏅",
      title: "Steady habit",
      detail: "Log food on 30 days",
      value: foodDates.length,
      target: 30,
    },
    {
      id: "meals",
      icon: "🥗",
      title: "Full day",
      detail: "Log breakfast, lunch and dinner",
      value: completeDays,
      target: 1,
    },
    {
      id: "training",
      icon: "💪",
      title: "Showing up",
      detail: "Finish 5 workouts",
      value: workouts,
      target: 5,
    },
    {
      id: "strength",
      icon: "🏆",
      title: "Strong routine",
      detail: "Finish 20 workouts",
      value: workouts,
      target: 20,
    },
    {
      id: "water",
      icon: "💧",
      title: "First sip",
      detail: "Log water on one day",
      value: waterDates.length,
      target: 1,
    },
    {
      id: "hydration",
      icon: "🌊",
      title: "Water habit",
      detail: "Log water on 10 days",
      value: waterDates.length,
      target: 10,
    },
    {
      id: "journal",
      icon: "📈",
      title: "Know your trend",
      detail: "Record 7 weigh-in days",
      value: new Set(
        state.measurements.filter((m) => m.date <= today).map((m) => m.date),
      ).size,
      target: 7,
    },
    {
      id: "saved",
      icon: "⭐",
      title: "Your favourites",
      detail: "Save 10 foods",
      value: state.savedFoods.length,
      target: 10,
    },
  ];
  return definitions.map((b) => ({ ...b, earned: b.value >= b.target }));
}
