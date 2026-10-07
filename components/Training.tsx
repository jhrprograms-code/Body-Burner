"use client";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock,
  Dumbbell,
  Flag,
  Library,
  Pause,
  Play,
  Plus,
  Search,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import {
  buildWeek,
  dayKey,
  exerciseMuscleCategories,
  exercises,
  fmt,
  lastExercise,
  loadSuggestion,
  MUSCLE_CATEGORIES,
  newExercise,
  sessionVolume,
  targetMuscleBreakdown,
  uid,
  WORKOUT_DURATION,
  weekDates,
  type Exercise,
  type Session,
  type WorkoutExercise,
} from "@/lib/domain";
import mediaManifest from "@/data/media.json";
import ExerciseMedia from "./ExerciseMedia";
import type { StoreProps } from "./BodyBurner";
import { Empty, Field, Heading, Modal, Section } from "./ui";
const media = mediaManifest as Record<
  string,
  { url: string; provider: string; license: string }
>;
export default function Training({ state, setState, notify }: StoreProps) {
  const plan = buildWeek(state.profile),
    [selected, setSelected] = useState((new Date().getDay() + 6) % 7),
    [library, setLibrary] = useState(false),
    [detail, setDetail] = useState<Exercise | null>(null),
    [summary, setSummary] = useState<Session | null>(null),
    [confirm, setConfirm] = useState<"finish" | "discard" | null>(null),
    [clock, setClock] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const day = plan[selected],
    dates = weekDates(dayKey()),
    active = state.active;
  function start() {
    if (!day.ids.length) return;
    setState((s) => ({
      ...s,
      active: {
        id: uid(),
        name: day.name,
        date: dayKey(),
        startedAt: Date.now(),
        exercises: day.ids.map((id) => newExercise(id, s.profile, s.sessions)),
      },
    }));
    notify("Workout started. Warm up before your working sets.");
  }
  function updateExercise(
    index: number,
    fn: (e: WorkoutExercise) => WorkoutExercise,
  ) {
    setState((s) => ({
      ...s,
      active: s.active
        ? {
            ...s.active,
            exercises: s.active.exercises.map((e, i) =>
              i === index ? fn(e) : e,
            ),
          }
        : null,
    }));
  }
  const rest = Math.max(
    0,
    Math.ceil(((active?.restUntil || 0) - clock) / 1000),
  );
  const completed =
      active?.exercises.reduce(
        (sum, e) => sum + e.sets.filter((s) => s.done).length,
        0,
      ) || 0,
    all = active?.exercises.reduce((sum, e) => sum + e.sets.length, 0) || 0,
    elapsedMinutes = active
      ? Math.floor((clock - active.startedAt) / 60000)
      : 0,
    durationMessage =
      elapsedMinutes < 80
        ? `${80 - elapsedMinutes} min until target window`
        : elapsedMinutes <= 90
          ? "80–90 min target reached"
          : "90 min reached — finish safely; do not add extra work";
  return (
    <>
      <Heading
        eyebrow="SHOW UP. GET STRONGER."
        title={active ? "One good set at a time." : "Your week. Your work."}
        text={
          active
            ? active.name
            : "Six focused gym days, followed by one recovery day."
        }
        action={
          <button className="secondary" onClick={() => setLibrary(true)}>
            <Library size={17} />
            Exercise library
          </button>
        }
      />
      {active ? (
        <>
          <div className="session-toolbar">
            <div className="row">
              <span className="status-dot pulse" />
              <strong>
                {elapsedMinutes}:
                {String(
                  Math.floor((clock - active.startedAt) / 1000) % 60,
                ).padStart(2, "0")}
              </strong>
              <span className="muted">
                {completed} / {all} sets
              </span>
              <span className="muted small">{durationMessage}</span>
            </div>
            <div className="row">
              <button
                className="text-btn"
                onClick={() => setConfirm("discard")}
              >
                Discard
              </button>
              <button
                className="primary"
                disabled={!completed}
                onClick={() => setConfirm("finish")}
              >
                Finish workout
                <Flag size={16} />
              </button>
            </div>
          </div>
          <div className="track session-progress">
            <span style={{ width: `${all ? (completed / all) * 100 : 0}%` }} />
          </div>
          <MuscleEmphasis
            ids={active.exercises.map((exercise) => exercise.exerciseId)}
          />
          {active.exercises.map((entry, index) => {
            const exercise = exercises.find((e) => e.id === entry.exerciseId)!;
            const previous = lastExercise(state.sessions, entry.exerciseId),
              suggestion = loadSuggestion(previous),
              timed = exercise.tracking !== "repetitions";
            return (
              <section
                className="panel exercise-card"
                key={`${entry.exerciseId}-${index}`}
              >
                <div className="exercise-header">
                  <button
                    className="exercise-art"
                    onClick={() => setDetail(exercise)}
                    aria-label={`View ${exercise.name} technique`}
                  >
                    {media[exercise.id] ? (
                      <ExerciseMedia
                        key={media[exercise.id].url}
                        url={media[exercise.id].url}
                        name={exercise.name}
                        thumbnail
                      />
                    ) : (
                      <Dumbbell size={29} strokeWidth={1.25} />
                    )}
                  </button>
                  <div>
                    <h2>{exercise.name}</h2>
                    <p>{exercise.muscles.join(" · ").replaceAll("_", " ")}</p>
                    <button
                      className="text-btn small"
                      onClick={() => setDetail(exercise)}
                    >
                      Technique & cues <ArrowUpRight size={13} />
                    </button>
                  </div>
                  <button
                    className="icon-btn"
                    aria-label={`Remove ${exercise.name}`}
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        active: s.active
                          ? {
                              ...s.active,
                              exercises: s.active.exercises.filter(
                                (_, i) => i !== index,
                              ),
                            }
                          : null,
                      }))
                    }
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="load-note">
                  {timed
                    ? "Log duration in the unit shown. Use a comfortable pace."
                    : suggestion.text}
                </p>
                <div className="set-table">
                  <div className="set-row set-labels">
                    <span>SET</span>
                    <span>PREVIOUS</span>
                    <span>KG</span>
                    <span>
                      {timed
                        ? exercise.tracking === "minutes"
                          ? "MINUTES"
                          : "SECONDS"
                        : "REPS"}
                    </span>
                    <span>RIR</span>
                    <span>DONE</span>
                  </div>
                  {entry.sets.map((set, si) => {
                    const prev = previous?.sets[si];
                    const valid =
                      Number(set.reps) > 0 &&
                      Number(set.reps) <= 10000 &&
                      (timed ||
                        (set.weight !== "" &&
                          Number(set.weight) >= 0 &&
                          Number(set.weight) <= 1000)) &&
                      (set.rir === "" ||
                        (Number(set.rir) >= 0 && Number(set.rir) <= 10));
                    return (
                      <div
                        className={`set-row ${set.done ? "set-done" : ""}`}
                        key={set.id}
                      >
                        <span className="set-number">{si + 1}</span>
                        <span className="previous">
                          {prev?.done
                            ? `${prev.weight || "0"} × ${prev.reps}`
                            : "—"}
                        </span>
                        <input
                          aria-label={`${exercise.name} set ${si + 1} weight kg`}
                          disabled={set.done || timed}
                          inputMode="decimal"
                          type="number"
                          min="0"
                          max="1000"
                          step="0.5"
                          placeholder={timed ? "—" : "kg"}
                          value={set.weight}
                          onChange={(ev) =>
                            updateExercise(index, (e) => ({
                              ...e,
                              sets: e.sets.map((s, i) =>
                                i === si
                                  ? { ...s, weight: ev.target.value }
                                  : s,
                              ),
                            }))
                          }
                        />
                        <input
                          aria-label={`${exercise.name} set ${si + 1} ${timed ? "duration or distance" : "reps"}`}
                          disabled={set.done}
                          type="number"
                          inputMode="numeric"
                          min="1"
                          max="10000"
                          step="1"
                          value={set.reps}
                          placeholder={timed ? "30" : "8–12"}
                          onChange={(ev) =>
                            updateExercise(index, (e) => ({
                              ...e,
                              sets: e.sets.map((s, i) =>
                                i === si ? { ...s, reps: ev.target.value } : s,
                              ),
                            }))
                          }
                        />
                        <input
                          aria-label={`${exercise.name} set ${si + 1} reps in reserve`}
                          disabled={set.done || timed}
                          type="number"
                          min="0"
                          max="10"
                          step="1"
                          inputMode="numeric"
                          placeholder="2–3"
                          value={set.rir}
                          onChange={(ev) =>
                            updateExercise(index, (e) => ({
                              ...e,
                              sets: e.sets.map((s, i) =>
                                i === si ? { ...s, rir: ev.target.value } : s,
                              ),
                            }))
                          }
                        />
                        <button
                          className={`set-check ${set.done ? "checked" : ""}`}
                          aria-label={
                            set.done ? "Undo completed set" : "Complete set"
                          }
                          disabled={!set.done && !valid}
                          onClick={() => {
                            updateExercise(index, (e) => ({
                              ...e,
                              sets: e.sets.map((s, i) =>
                                i === si ? { ...s, done: !s.done } : s,
                              ),
                            }));
                            if (!set.done)
                              setState((s) => ({
                                ...s,
                                active: s.active
                                  ? {
                                      ...s.active,
                                      restUntil: Date.now() + 90000,
                                    }
                                  : null,
                              }));
                          }}
                        >
                          <Check size={17} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="exercise-bottom">
                  <button
                    className="text-btn"
                    onClick={() =>
                      updateExercise(index, (e) => ({
                        ...e,
                        sets: [
                          ...e.sets,
                          {
                            id: uid(),
                            weight: e.sets.at(-1)?.weight || "",
                            reps: "",
                            rir: "",
                            done: false,
                          },
                        ],
                      }))
                    }
                  >
                    <Plus size={15} />
                    Add set
                  </button>
                  <button
                    className="text-btn"
                    disabled={entry.sets.length <= 1 || entry.sets.at(-1)?.done}
                    onClick={() =>
                      updateExercise(index, (e) => ({
                        ...e,
                        sets: e.sets.slice(0, -1),
                      }))
                    }
                  >
                    Remove last
                  </button>
                  <label className="checkbox-label small">
                    <input
                      type="checkbox"
                      checked={entry.pain}
                      onChange={(ev) =>
                        updateExercise(index, (e) => ({
                          ...e,
                          pain: ev.target.checked,
                        }))
                      }
                    />
                    Pain / discomfort
                  </label>
                </div>
                {entry.pain && (
                  <p className="notice">
                    Pause this movement. Choose a comfortable alternative;
                    persistent or significant pain needs professional
                    assessment.
                  </p>
                )}
              </section>
            );
          })}
          <button className="secondary full" onClick={() => setLibrary(true)}>
            <Plus size={17} />
            Add an exercise
          </button>
          <p className="muted small">
            RIR = reps left in reserve. Log dumbbell weight per hand and barbell
            weight including the bar. Machine numbers are only comparable on the
            same machine.
          </p>
          <div className="rest-bar">
            <Clock size={19} />
            <span>Rest timer</span>
            <strong>
              {Math.floor(rest / 60)}:{String(rest % 60).padStart(2, "0")}
            </strong>
            <button
              className="secondary"
              onClick={() =>
                setState((s) => ({
                  ...s,
                  active: s.active
                    ? {
                        ...s.active,
                        restUntil:
                          Math.max(Date.now(), s.active.restUntil || 0) + 30000,
                      }
                    : null,
                }))
              }
            >
              +30 sec
            </button>
            <button
              className="icon-btn"
              aria-label="Stop rest timer"
              onClick={() =>
                setState((s) => ({
                  ...s,
                  active: s.active ? { ...s.active, restUntil: 0 } : null,
                }))
              }
            >
              <X size={17} />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="training-layout">
            <div>
              <div className="plan-days">
                {dates.map((d, i) => (
                  <button
                    key={d}
                    className={selected === i ? "selected" : ""}
                    onClick={() => setSelected(i)}
                  >
                    <span>
                      {new Date(d + "T12:00:00").toLocaleDateString("en", {
                        weekday: "short",
                      })}
                    </span>
                    <strong>{new Date(d + "T12:00:00").getDate()}</strong>
                    {plan[i].ids.length ? (
                      <Dumbbell size={15} />
                    ) : (
                      <span className="rest-dot" />
                    )}
                  </button>
                ))}
              </div>
              <section className="panel plan-feature">
                <div className="row between">
                  <span className="pill">
                    {day.ids.length ? "TRAINING DAY" : "RECOVERY DAY"}
                  </span>
                  <span className="muted small">
                    {state.profile.equipment === "gym"
                      ? "Full gym"
                      : state.profile.equipment === "dumbbells"
                        ? "Dumbbells"
                        : "Bodyweight"}
                  </span>
                </div>
                <h2>{day.name}</h2>
                <p>{day.focus}</p>
                {day.ids.length ? (
                  <>
                    <div className="row plan-meta">
                      <span>
                        <Dumbbell size={15} />
                        {day.ids.length} exercises
                      </span>
                      <span>
                        <Clock size={15} />
                        {day.duration}
                      </span>
                    </div>
                    <button className="primary" onClick={start}>
                      Start workout
                      <ArrowRight size={17} />
                    </button>
                  </>
                ) : (
                  <p className="notice">
                    Take an easy 15–30 minute walk if comfortable, or enjoy a
                    complete rest day. You don’t need to earn your recovery.
                  </p>
                )}
              </section>
              <MuscleEmphasis ids={day.ids} />
              <div className="plan-exercises">
                {day.ids.map((id, i) => {
                  const e = exercises.find((x) => x.id === id)!;
                  return (
                    <button
                      key={id}
                      className="plan-exercise"
                      onClick={() => setDetail(e)}
                    >
                      <span className="muted">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="exercise-art">
                        {media[id] ? (
                          <ExerciseMedia
                            key={media[id].url}
                            url={media[id].url}
                            name={e.name}
                            thumbnail
                          />
                        ) : (
                          <Dumbbell size={25} strokeWidth={1.3} />
                        )}
                      </span>
                      <span>
                        <strong>{e.name}</strong>
                        <small>
                          {state.profile.experience === "new" ? 2 : 3} sets ·{" "}
                          {e.tracking === "repetitions"
                            ? "8–12 reps · 2–3 RIR"
                            : e.tracking === "minutes"
                              ? "easy, conversational pace"
                              : "20–40 seconds, controlled"}
                        </small>
                      </span>
                      <ArrowUpRight size={17} />
                    </button>
                  );
                })}
              </div>
              <p className="muted small">
                Target {WORKOUT_DURATION}: about 10 minutes to warm up, 60–65
                minutes for the listed resistance work, and 10–15 minutes of
                easy conditioning or cooldown. Rest roughly 90–180 seconds as
                needed. The plan is editable and is not a clinical prescription.
              </p>
              {state.profile.equipment === "bodyweight" && (
                <p className="notice">
                  A bodyweight-only setup has limited pulling options. Bird dogs
                  support trunk control; they do not replace loaded rows. Add a
                  safe band or gym access for balanced pulling work.
                </p>
              )}
              {state.profile.limitations && (
                <p className="notice">
                  Your notes: {state.profile.limitations}. This general template
                  has not been adapted to an injury or medical condition. Review
                  exercise suitability before starting.
                </p>
              )}
            </div>
            <aside>
              <Section title="Your 7-day plan">
                {plan.map((p, i) => (
                  <button
                    className={`week-plan-row ${selected === i ? "active" : ""}`}
                    key={i}
                    onClick={() => setSelected(i)}
                  >
                    <span>
                      {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][i]}
                    </span>
                    <div>
                      <strong>{p.name}</strong>
                      <small>
                        {p.ids.length
                          ? `${p.ids.length} exercises`
                          : "Recovery"}
                      </small>
                    </div>
                    {p.ids.length ? (
                      <Dumbbell size={16} />
                    ) : (
                      <span className="rest-dot" />
                    )}
                  </button>
                ))}
              </Section>
              <Section title="Recent sessions">
                {state.sessions.length ? (
                  [...state.sessions]
                    .reverse()
                    .slice(0, 5)
                    .map((s) => (
                      <button
                        className="history-row"
                        key={s.id}
                        onClick={() => setSummary(s)}
                      >
                        <span>
                          <strong>{s.name}</strong>
                          <small>
                            {s.date} ·{" "}
                            {s.exercises.reduce(
                              (a, e) => a + e.sets.filter((s) => s.done).length,
                              0,
                            )}{" "}
                            sets
                          </small>
                        </span>
                        <ArrowUpRight size={16} />
                      </button>
                    ))
                ) : (
                  <Empty
                    icon={<Dumbbell size={23} />}
                    headline="Your first chapter."
                    text="Finished workouts will appear here."
                  />
                )}
              </Section>
            </aside>
          </div>
        </>
      )}
      {library && (
        <ExerciseLibrary
          onClose={() => setLibrary(false)}
          onSelect={(e) => {
            if (active) {
              setState((s) => ({
                ...s,
                active: s.active
                  ? {
                      ...s.active,
                      exercises: [
                        ...s.active.exercises,
                        newExercise(e.id, s.profile, s.sessions),
                      ],
                    }
                  : null,
              }));
              setLibrary(false);
              notify("Exercise added");
            } else {
              setDetail(e);
            }
          }}
        />
      )}
      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(null)}>
          <div className="detail-media">
            {media[detail.id] ? (
              <ExerciseMedia
                key={media[detail.id].url}
                url={media[detail.id].url}
                name={detail.name}
                expanded
              />
            ) : (
              <>
                <Dumbbell size={50} strokeWidth={1} />
                <p>Technique guide</p>
                <small>
                  Animation will appear after licensed media is installed.
                </small>
              </>
            )}
          </div>
          <p className="muted">
            {detail.muscles.join(" · ").replaceAll("_", " ")} ·{" "}
            {detail.equipment.join(", ")}
          </p>
          <ol className="cue-list">
            {detail.cues.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ol>
          <p className="notice small">
            Use a comfortable range and load. These draft cues support learning;
            a qualified coach can check your technique in person.
          </p>
        </Modal>
      )}
      {confirm && (
        <Modal
          title={
            confirm === "finish"
              ? "Finish this session?"
              : "Discard this session?"
          }
          onClose={() => setConfirm(null)}
        >
          <p className="muted">
            {confirm === "finish"
              ? `${completed} completed sets will be saved. Unfinished sets remain visible in the summary and don’t count toward volume.`
              : "This removes the current workout and its sets. Completed workout history stays saved."}
          </p>
          <button
            className="primary full"
            onClick={() => {
              if (confirm === "finish" && active) {
                const done = {
                  ...active,
                  finishedAt: Date.now(),
                  restUntil: 0,
                };
                setState((s) => ({
                  ...s,
                  sessions: [...s.sessions, done],
                  active: null,
                }));
                setSummary(done);
                notify("Workout saved. Nice work showing up.");
              } else setState((s) => ({ ...s, active: null }));
              setConfirm(null);
            }}
          >
            {confirm === "finish" ? "Save workout" : "Discard workout"}
          </button>
        </Modal>
      )}
      {summary && (
        <Modal title="Work put in." onClose={() => setSummary(null)}>
          <div className="workout-celebrate">
            <Trophy size={38} strokeWidth={1.2} />
            <h2>{summary.name}</h2>
            <p>{summary.date}</p>
          </div>
          <div className="summary-stats">
            <div>
              <strong>
                {Math.round(
                  ((summary.finishedAt || summary.startedAt) -
                    summary.startedAt) /
                    60000,
                )}
              </strong>
              <span>minutes</span>
            </div>
            <div>
              <strong>
                {summary.exercises.reduce(
                  (a, e) => a + e.sets.filter((s) => s.done).length,
                  0,
                )}
              </strong>
              <span>sets</span>
            </div>
            <div>
              <strong>{fmt(sessionVolume(summary))}</strong>
              <span>logged kg × reps</span>
            </div>
          </div>
          {summary.exercises.map((e, i) => (
            <div className="history-detail" key={i}>
              <strong>
                {exercises.find((x) => x.id === e.exerciseId)?.name}
              </strong>
              <p>
                {e.sets
                  .filter((s) => s.done)
                  .map((s) =>
                    exercises.find((x) => x.id === e.exerciseId)?.tracking ===
                    "repetitions"
                      ? `${s.weight || 0} kg × ${s.reps}`
                      : `${s.reps} ${exercises.find((x) => x.id === e.exerciseId)?.tracking === "minutes" ? "min" : "sec"}`,
                  )
                  .join(" · ") || "No completed sets"}
              </p>
            </div>
          ))}
          <p className="muted small">
            Volume uses your entered weights; dumbbells logged per hand are not
            doubled. Compare like-for-like sessions.
          </p>
        </Modal>
      )}
    </>
  );
}
function MuscleEmphasis({ ids }: { ids: string[] }) {
  const breakdown = targetMuscleBreakdown(ids);
  if (!breakdown.length) return null;
  return (
    <section className="muscle-emphasis" aria-labelledby="target-muscles">
      <div className="row between">
        <div>
          <span className="eyebrow">PLAN EMPHASIS</span>
          <h3 id="target-muscles">Target muscles</h3>
        </div>
        <span className="muted small">Based on exercise tags</span>
      </div>
      <div className="muscle-emphasis-grid">
        {breakdown.map((muscle) => (
          <div className="muscle-emphasis-card" key={muscle.id}>
            <span className="muscle-monogram" aria-hidden="true">
              {muscle.label.slice(0, 2).toUpperCase()}
            </span>
            <span>
              <strong>{muscle.label}</strong>
              <small>{muscle.percentage}% of plan emphasis</small>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExerciseLibrary({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (e: Exercise) => void;
}) {
  type BrowseMode = "muscles" | "movement" | "equipment" | "all";
  const [query, setQuery] = useState(""),
    [mode, setMode] = useState<BrowseMode>("muscles"),
    [category, setCategory] = useState(""),
    [visibleCount, setVisibleCount] = useState(40);
  const normalizedQuery = query.trim().toLowerCase();
  const movementCategories = [...new Set(exercises.map((e) => e.group))]
    .map((id) => ({ id, label: id.replaceAll("_", " ") }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const equipmentCategories = [
    ...new Set(exercises.flatMap((e) => e.equipment)),
  ]
    .map((id) => ({ id, label: id.replaceAll("_", " ") }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const categories =
    mode === "muscles"
      ? MUSCLE_CATEGORIES
      : mode === "movement"
        ? movementCategories
        : equipmentCategories;
  const matchesCategory = (exercise: Exercise) => {
    if (!category || mode === "all") return true;
    if (mode === "muscles")
      return exerciseMuscleCategories(exercise).includes(
        category as (typeof MUSCLE_CATEGORIES)[number]["id"],
      );
    if (mode === "movement") return exercise.group === category;
    return (exercise.equipment as readonly string[]).includes(category);
  };
  const list = exercises
    .filter(
      (exercise) =>
        matchesCategory(exercise) &&
        (!normalizedQuery ||
          `${exercise.name} ${exercise.muscles.join(" ")} ${exercise.equipment.join(" ")}`
            .toLowerCase()
            .includes(normalizedQuery)),
    )
    .toSorted((a, b) => a.name.localeCompare(b.name));
  const showCategories = !normalizedQuery && mode !== "all" && !category;
  const selectedLabel = categories.find((item) => item.id === category)?.label;
  const setBrowseMode = (next: BrowseMode) => {
    setMode(next);
    setCategory("");
    setVisibleCount(40);
  };
  return (
    <Modal title="Your movement library" onClose={onClose} wide>
      <p className="muted">
        Browse by muscle first, or switch to movement, equipment or the complete
        catalogue.
      </p>
      <div className="search-input">
        <Search size={18} />
        <input
          autoFocus
          aria-label="Search exercises"
          placeholder="Search exercises, muscles or equipment"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setVisibleCount(40);
          }}
        />
      </div>
      <div
        className="library-tabs"
        role="tablist"
        aria-label="Browse exercises"
      >
        {(
          [
            ["muscles", "Muscles"],
            ["movement", "Movement"],
            ["equipment", "Equipment"],
            ["all", "All"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={mode === id}
            className={mode === id ? "active" : ""}
            onClick={() => setBrowseMode(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {showCategories ? (
        <div className="library-category-grid">
          {categories.map((item) => {
            const count = exercises.filter((exercise) => {
              if (mode === "muscles")
                return exerciseMuscleCategories(exercise).includes(
                  item.id as (typeof MUSCLE_CATEGORIES)[number]["id"],
                );
              if (mode === "movement") return exercise.group === item.id;
              return (exercise.equipment as readonly string[]).includes(
                item.id,
              );
            }).length;
            if (!count) return null;
            return (
              <button
                className="library-category"
                key={item.id}
                onClick={() => {
                  setCategory(item.id);
                  setVisibleCount(40);
                }}
              >
                <span className="muscle-monogram" aria-hidden="true">
                  {item.label.slice(0, 2).toUpperCase()}
                </span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{count} exercises</small>
                </span>
                <ArrowRight size={17} />
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <div className="library-result-head row between">
            <div className="row">
              {category && !normalizedQuery && (
                <button
                  className="icon-btn"
                  aria-label="Back to categories"
                  onClick={() => setCategory("")}
                >
                  <ArrowLeft size={17} />
                </button>
              )}
              <strong>
                {normalizedQuery
                  ? `Search results for “${query.trim()}”`
                  : selectedLabel || "All exercises"}
              </strong>
            </div>
            <span className="muted small">{list.length} exercises</span>
          </div>
          <div className="search-results library-results">
            {list.slice(0, visibleCount).map((exercise) => (
              <button
                className="result-row"
                key={exercise.id}
                onClick={() => onSelect(exercise)}
              >
                <span className="exercise-art">
                  {media[exercise.id] ? (
                    <ExerciseMedia
                      key={media[exercise.id].url}
                      url={media[exercise.id].url}
                      name={exercise.name}
                      thumbnail
                    />
                  ) : (
                    <Dumbbell size={23} strokeWidth={1.2} />
                  )}
                </span>
                <span>
                  <strong>{exercise.name}</strong>
                  <small>
                    {exercise.muscles.join(" · ").replaceAll("_", " ")}
                  </small>
                </span>
                <Plus size={17} />
              </button>
            ))}
          </div>
          {list.length > visibleCount && (
            <button
              className="secondary full"
              onClick={() => setVisibleCount((count) => count + 40)}
            >
              Show more exercises
            </button>
          )}
          {!list.length && (
            <Empty
              icon={<Search size={22} />}
              headline="No exercises found."
              text="Try another muscle, movement or search term."
            />
          )}
          <p className="muted small">
            {list.filter((exercise) => media[exercise.id]).length} licensed
            video demonstrations in this result. Sign in to view thumbnails and
            technique videos.
          </p>
        </>
      )}
    </Modal>
  );
}
