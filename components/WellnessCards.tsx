"use client";
import { useState } from "react";
import { Flame, Droplets, Trophy, Target } from "lucide-react";
import { dayKey, dateOffset, fmt, totalFoods, uid } from "@/lib/domain";
import { bmi, earnedBadges, loggingStreak, weightChange } from "@/lib/wellness";
import type { StoreProps } from "./BodyBurner";
import { Field, Section } from "./ui";

export function Ring({
  value,
  max,
  icon,
  colour = "#1d1d24",
}: {
  value: number;
  max: number;
  icon: React.ReactNode;
  colour?: string;
}) {
  const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      className="wellness-ring"
      aria-label={
        max > 0 ? `${Math.round(percent)} percent of target` : "Target not set"
      }
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="42" className="ring-track" />
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke={colour}
          strokeDasharray={`${percent * 2.639} 263.9`}
          className="ring-fill"
        />
      </svg>
      <span style={{ color: colour }}>{icon}</span>
    </div>
  );
}

export function NutritionDashboard({
  state,
  setState,
  notify,
  date,
  setDate,
  onScan,
}: StoreProps & {
  date: string;
  setDate: (date: string) => void;
  onScan: () => void;
}) {
  const [waterAmount, setWaterAmount] = useState(250);
  const total = totalFoods(state.foods.filter((f) => f.date === date));
  const loggedFoods = state.foods.filter((f) => f.date === date);
  const streak = loggingStreak(
    state.foods.map((f) => f.date),
    dayKey(),
  );
  const water = (state.water || []).filter((w) => w.date === date);
  const week = Array.from({ length: 7 }, (_, i) => dateOffset(date, i - 3));
  return (
    <div className="wellness-dashboard">
      <div className="row between">
        <h2>Your daily fuel</h2>
        <span className="streak-chip">
          <Flame size={16} />
          {streak} day{streak === 1 ? "" : "s"}
        </span>
      </div>
      <div className="wellness-week">
        {week.map((d) => (
          <button
            key={d}
            disabled={d > dayKey()}
            className={d === date ? "selected" : ""}
            onClick={() => setDate(d)}
            aria-label={`View nutrition for ${d}`}
          >
            <small>
              {new Date(d + "T12:00:00").toLocaleDateString("en", {
                weekday: "short",
              })}
            </small>
            <strong>{Number(d.slice(-2))}</strong>
            <i
              className={state.foods.some((f) => f.date === d) ? "logged" : ""}
            />
          </button>
        ))}
      </div>
      <div className="wellness-energy">
        <div>
          <strong>
            {state.profile.calories
              ? fmt(Math.max(0, state.profile.calories - total.calories))
              : "—"}
          </strong>
          <p>
            {total.calories > state.profile.calories && state.profile.calories
              ? `${fmt(total.calories - state.profile.calories)} kcal above target`
              : "Calories remaining"}
          </p>
          <small>
            {fmt(total.calories)} eaten ·{" "}
            {state.profile.calories ? fmt(state.profile.calories) : "No"} target
          </small>
        </div>
        <Ring
          value={total.calories}
          max={state.profile.calories}
          icon={<Flame size={30} />}
        />
      </div>
      <div className="wellness-macros">
        {(
          [
            { key: "protein", name: "Protein", icon: "🍗", colour: "#d96b73" },
            { key: "carbs", name: "Carbs", icon: "🌾", colour: "#d59a66" },
            { key: "fat", name: "Fat", icon: "🥑", colour: "#6c98d5" },
          ] as const
        ).map((m) => (
          <div className="wellness-macro" key={m.key}>
            <strong>
              {state.profile[m.key]
                ? fmt(Math.max(0, state.profile[m.key] - total[m.key]))
                : "—"}
              <small> g</small>
            </strong>
            <p>{m.name} left</p>
            <Ring
              value={total[m.key]}
              max={state.profile[m.key]}
              icon={m.icon}
              colour={m.colour}
            />
          </div>
        ))}
      </div>
      <div className="wellness-macros micro-cards">
        {(
          [
            { key: "fiber", label: "Fiber", unit: "g", icon: "🫐" },
            { key: "sugar", label: "Total sugar", unit: "g", icon: "🥄" },
            { key: "sodium", label: "Sodium", unit: "mg", icon: "🧂" },
          ] as const
        ).map((m) => {
          const known = loggedFoods.filter((f) => f[m.key] !== undefined);
          return (
            <div className="wellness-macro" key={m.key}>
              <span aria-hidden="true">{m.icon}</span>
              <p>{m.label} logged</p>
              <strong>
                {known.length
                  ? fmt(known.reduce((sum, f) => sum + (f[m.key] || 0), 0))
                  : "—"}
                <small> {m.unit}</small>
              </strong>
              <small className="micro-coverage">
                {known.length} / {loggedFoods.length} foods have data
              </small>
            </div>
          );
        })}
      </div>
      <p className="muted small">
        Micronutrient totals include known values only. Missing data is not
        zero; photo estimates are approximate.
      </p>
      <button className="primary full scan-cta" onClick={onScan}>
        📷 Scan a meal
      </button>
      <div className="wellness-water">
        <div className="row between">
          <h3>
            <Droplets size={20} /> Water
          </h3>
          <strong>{fmt(water.reduce((sum, w) => sum + w.ml, 0))} ml</strong>
        </div>
        <div className="row">
          <input
            aria-label="Water amount in millilitres"
            type="number"
            min={1}
            max={3000}
            value={waterAmount}
            onChange={(e) => setWaterAmount(Number(e.target.value))}
          />
          <button
            className="secondary"
            disabled={
              !Number.isFinite(waterAmount) ||
              waterAmount <= 0 ||
              waterAmount > 3000
            }
            onClick={() => {
              setState((s) => ({
                ...s,
                water: [
                  ...(s.water || []),
                  { id: uid(), date, ml: waterAmount },
                ],
              }));
              notify("Water logged");
            }}
          >
            Log water
          </button>
        </div>
        {water.length > 0 && (
          <button
            className="text-btn"
            onClick={() =>
              setState((s) => ({
                ...s,
                water: (s.water || []).filter((w) => w.id !== water.at(-1)?.id),
              }))
            }
          >
            Undo last water entry
          </button>
        )}
      </div>
    </div>
  );
}

export function ProgressHighlights({ state, setState, notify }: StoreProps) {
  const today = dayKey();
  const entries = state.measurements
    .filter((m) => m.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const first = entries[0],
    latest = entries.at(-1);
  const current = latest?.weight || state.profile.weight;
  const result = bmi(current, state.profile.height);
  const badges = earnedBadges(state, today);
  const [target, setTarget] = useState(
    state.targetWeight ? String(state.targetWeight) : "",
  );
  const distance =
    first && state.targetWeight
      ? Math.abs(first.weight - state.targetWeight)
      : 0;
  const progress =
    first && state.targetWeight && distance > 0
      ? Math.max(
          0,
          Math.min(
            100,
            (1 - Math.abs(current - state.targetWeight) / distance) * 100,
          ),
        )
      : 0;
  return (
    <div className="wellness-progress">
      <Section title="Your weight journey" action={<Target size={20} />}>
        <div className="journey-current">
          <strong>
            {current ? fmt(current) : "—"}
            <small> kg</small>
          </strong>
          <span>
            {latest
              ? `Latest · ${latest.date}`
              : "Profile weight · log a weigh-in to begin"}
          </span>
        </div>
        <div className="journey-track">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="row between muted small">
          <span>Start {first ? `${fmt(first.weight)} kg` : "—"}</span>
          <span>
            {state.targetWeight
              ? `${Math.round(progress)}% toward goal`
              : "Your pace, your goal"}
          </span>
        </div>
        <form
          className="row goal-form"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(target);
            if (n >= 30 && n <= 300) {
              setState((s) => ({ ...s, targetWeight: n }));
              notify("Weight goal saved");
            }
          }}
        >
          <Field label="Goal weight (kg)">
            <input
              type="number"
              min={30}
              max={300}
              step="0.1"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
            />
          </Field>
          <button className="secondary">Save goal</button>
        </form>
        <p className="muted small">
          Progress uses your first logged weigh-in. No deadline or weight-loss
          promise.
        </p>
      </Section>
      <div className="wellness-two">
        <Section title="Weight changes">
          {[3, 7, 14, 30, 90].map((days) => {
            const change = weightChange(entries, today, days);
            return (
              <div className="change-row" key={days}>
                <span>{days} days</span>
                <strong>
                  {change === null
                    ? "—"
                    : `${change > 0 ? "+" : ""}${fmt(change)} kg`}
                </strong>
                <small>
                  {change === null
                    ? "More history needed"
                    : "From earlier weigh-in"}
                </small>
              </div>
            );
          })}
        </Section>
        <Section title="Body mass index">
          <div className="bmi-number">{result ? fmt(result.value) : "—"}</div>
          <span className="bmi-category">
            {result?.category || "Add height and weight"}
          </span>
          <div className="bmi-scale" aria-hidden="true">
            {result && (
              <i
                style={{
                  left: `${Math.max(0, Math.min(100, ((result.value - 15) / 25) * 100))}%`,
                }}
              />
            )}
          </div>
          <p className="muted small">
            Adult ranges: under 18.5, 18.5–24.9, 25–29.9, 30 and above. BMI is a
            screening measure, not body fat or a diagnosis; it does not
            distinguish muscle from fat.
          </p>
        </Section>
      </div>
      <Section
        title="Milestones & badges"
        action={
          <span className="pill">
            {badges.filter((b) => b.earned).length} / {badges.length} earned
          </span>
        }
      >
        <p className="muted">
          Small habits count. Badges reflect your recorded activity, not eating
          less.
        </p>
        <div className="badge-grid">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`wellness-badge ${b.earned ? "earned" : "locked"}`}
            >
              <div className="badge-medal" aria-hidden="true">
                {b.earned ? b.icon : <Trophy size={25} />}
              </div>
              <strong>{b.title}</strong>
              <small>{b.detail}</small>
              <span>
                {b.earned
                  ? "Earned ✓"
                  : `${Math.min(b.value, b.target)} / ${b.target}`}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
