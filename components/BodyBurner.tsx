"use client";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { User } from "@supabase/supabase-js";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  Home,
  LogOut,
  Plus,
  Settings as SettingsIcon,
  Sparkles,
  Target,
  Utensils,
  Weight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useStore, exportData } from "@/lib/store";
import {
  dayKey,
  dateOffset,
  weekDates,
  buildWeek,
  totalFoods,
  weightTrend,
  fmt,
  type State,
} from "@/lib/domain";
import {
  Brand,
  Empty,
  Heading,
  Section,
  Meter,
  Modal,
  Field,
  ErrorNote,
  LinkButton,
} from "./ui";
import Nutrition from "./Nutrition";
import Training from "./Training";
import Progress from "./Progress";
import Coach from "./Coach";
import Settings from "./Settings";
export type StoreProps = {
  state: State;
  setState: Dispatch<SetStateAction<State>>;
  notify: (s: string) => void;
};
type Tab =
  "Today" | "Training" | "Nutrition" | "Progress" | "Coach" | "Settings";
const nav = [
  { name: "Today", icon: Home },
  { name: "Training", icon: Dumbbell },
  { name: "Nutrition", icon: Utensils },
  { name: "Progress", icon: Activity },
  { name: "Coach", icon: Sparkles },
  { name: "Settings", icon: SettingsIcon },
] as const;
export default function BodyBurner() {
  const [user, setUser] = useState<User | null>(null),
    [authReady, setAuthReady] = useState(!supabase),
    [login, setLogin] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setAuthReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  if (!authReady)
    return (
      <div className="loading">
        <Brand />
        <p>Opening your space…</p>
      </div>
    );
  return (
    <>
      <Workspace
        key={user?.id || "local"}
        user={user}
        onLogin={() => setLogin(true)}
      />
      {login && <Login onClose={() => setLogin(false)} />}
    </>
  );
}
function Login({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal title="Your private space" onClose={onClose}>
      <p className="muted">
        Enter your email to create or open your private account. Your training,
        meals and photos belong to your account.
      </p>
      {!supabase ? (
        <div className="notice">
          Cloud accounts aren’t connected yet. Add the Supabase project settings
          during deployment. Local logging is available now.
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMessage("");
            const { error } = await supabase!.auth.signInWithOtp({
              email,
              options: {
                shouldCreateUser: true,
                emailRedirectTo: window.location.origin,
              },
            });
            setMessage(
              error
                ? "Unable to send a sign-in link. Check the email address and try again."
                : "Check your inbox for a sign-in link.",
            );
            setBusy(false);
          }}
        >
          <Field label="Email address">
            <input
              autoFocus
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          <button className="primary full" disabled={busy}>
            {busy ? "Sending…" : "Send sign-in link"}
            <ArrowRight size={17} />
          </button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
    </Modal>
  );
}
function Workspace({
  user,
  onLogin,
}: {
  user: User | null;
  onLogin: () => void;
}) {
  const { state, setState, ready, status, blocked } = useStore(
    user?.id || null,
  );
  const [tab, setTab] = useState<Tab>("Today"),
    [toast, setToast] = useState(""),
    [date, setDate] = useState(dayKey());
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(id);
  }, [toast]);
  const props = { state, setState, notify: setToast };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div className="workspace-label">YOUR EVERYDAY STRONG</div>
        <nav aria-label="Main navigation">
          {nav.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${tab === name ? "active" : ""}`}
              onClick={() => setTab(name)}
              aria-current={tab === name ? "page" : undefined}
            >
              <Icon size={20} />
              <span>{name}</span>
              {name === "Coach" && <span className="tiny-tag">AI</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="private-card">
            <div className="row">
              <span className="status-dot" />
              <span>{user ? "Private account" : "Local workspace"}</span>
            </div>
            <p>
              {user
                ? "Your progress. Your pace."
                : "Try the app. Sign in to sync."}
            </p>
            {!user && (
              <button className="text-btn" onClick={onLogin}>
                Connect account <ArrowUpRight size={14} />
              </button>
            )}
          </div>
          <button className="account" onClick={() => setTab("Settings")}>
            <span className="avatar">
              {(state.profile.name || "B").slice(0, 1).toUpperCase()}
            </span>
            <span>
              <strong>{state.profile.name || "Your profile"}</strong>
              <small>{user ? "Personal account" : "Set up your goals"}</small>
            </span>
            <SettingsIcon size={17} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span className="breadcrumb">
            Your space <span>/</span> <strong>{tab}</strong>
          </span>
          <div className="row">
            <span className={`sync-status ${blocked ? "warning" : ""}`}>
              {status}
            </span>
            <button
              className="icon-btn mobile-brand"
              aria-label="Open settings"
              onClick={() => setTab("Settings")}
            >
              <Flame size={22} />
            </button>
            <span className="top-avatar">
              {(state.profile.name || "B").slice(0, 1)}
            </span>
          </div>
        </header>
        <main>
          {blocked && (
            <div className="error row between">
              <span>{status}</span>
              <button className="secondary" onClick={() => exportData(state)}>
                Export edits
              </button>
              <button className="secondary" onClick={() => location.reload()}>
                Reload
              </button>
              {user && (
                <button
                  className="secondary"
                  onClick={() => supabase?.auth.signOut()}
                >
                  Sign out
                </button>
              )}
            </div>
          )}
          {!ready ? (
            <div className="loading">
              <Flame size={30} />
              <p>Loading your journal…</p>
            </div>
          ) : (
            <div
              className="page-content"
              key={tab}
              inert={blocked || undefined}
            >
              {tab === "Today" && (
                <Dashboard
                  {...props}
                  date={date}
                  setDate={setDate}
                  go={setTab}
                />
              )}{" "}
              {tab === "Training" && <Training {...props} />}{" "}
              {tab === "Nutrition" && (
                <Nutrition {...props} date={date} setDate={setDate} />
              )}{" "}
              {tab === "Progress" && <Progress {...props} user={user} />}{" "}
              {tab === "Coach" && <Coach {...props} />}{" "}
              {tab === "Settings" && (
                <Settings
                  {...props}
                  user={user}
                  onLogin={onLogin}
                  saveStatus={status}
                />
              )}
            </div>
          )}
        </main>
        <footer className="app-footer">
          <span>Small steps. Stronger every day.</span>
          <span>BODY BURNER / 01</span>
        </footer>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
function Dashboard({
  state,
  date,
  setDate,
  go,
}: {
  state: State;
  date: string;
  setDate: (s: string) => void;
  go: (t: Tab) => void;
}) {
  const totals = totalFoods(state.foods.filter((f) => f.date === date)),
    p = state.profile,
    week = buildWeek(p),
    workoutDays = week.filter((day) => day.ids.length).length,
    index = (new Date(date + "T12:00:00").getDay() + 6) % 7,
    today = week[index];
  const remaining = p.calories ? Math.max(0, p.calories - totals.calories) : 0,
    progress = p.calories
      ? Math.min(100, (totals.calories / p.calories) * 100)
      : 0;
  const sessions = state.sessions.filter(
    (s) => s.date >= dateOffset(dayKey(), -6) && s.date <= dayKey(),
  );
  const trend = weightTrend(state.measurements, dayKey());
  const done = [
    state.foods.some((f) => f.date === date),
    state.measurements.some((m) => m.date === date),
    state.sessions.some((s) => s.date === date),
  ];
  return (
    <>
      <Heading
        eyebrow="MAKE ROOM FOR PROGRESS"
        title={
          p.name
            ? `Let’s get after it, ${p.name.split(" ")[0]}.`
            : "A stronger you starts here."
        }
        text={new Date(date + "T12:00:00").toLocaleDateString("en-CA", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
        action={
          <button className="secondary" onClick={() => go("Progress")}>
            <Plus size={17} />
            Check in
          </button>
        }
      />
      <div className="week-strip">
        {weekDates(date).map((d) => (
          <button
            key={d}
            onClick={() => setDate(d)}
            className={`day-button ${d === date ? "selected" : ""}`}
          >
            <span>
              {new Date(d + "T12:00:00").toLocaleDateString("en", {
                weekday: "short",
              })}
            </span>
            <strong>{new Date(d + "T12:00:00").getDate()}</strong>
            <i
              className={
                state.sessions.some((s) => s.date === d) ? "has-workout" : ""
              }
            />
          </button>
        ))}
        <button
          className="icon-btn"
          aria-label="Previous week"
          onClick={() => setDate(dateOffset(date, -7))}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          className="icon-btn"
          aria-label="Next week"
          onClick={() => setDate(dateOffset(date, 7))}
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <section className="workout-hero">
            <div className="hero-top">
              <span className="pill">
                <span className="status-dot" />
                {today.ids.length ? "YOUR NEXT SESSION" : "RECOVER & RECHARGE"}
              </span>
              <span className="muted small">{workoutDays} day plan</span>
            </div>
            <div className="hero-content">
              <div>
                <h2>{state.active ? state.active.name : today.name}</h2>
                <p>
                  {today.ids.length
                    ? `${today.ids.length} exercises · ${today.duration} · ${p.equipment === "gym" ? "Gym" : "At home"}`
                    : today.focus}
                </p>
                <button className="primary" onClick={() => go("Training")}>
                  {state.active
                    ? "Resume workout"
                    : today.ids.length
                      ? "View workout"
                      : "View your week"}
                  <ArrowUpRight size={18} />
                </button>
              </div>
              <div className="hero-art" aria-hidden="true">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <Dumbbell size={78} strokeWidth={1} />
                <span>BUILT BY YOU.</span>
              </div>
            </div>
            <div className="hero-footer">
              <span>
                <Target size={14} />
                Consistency over intensity
              </span>
              <span>01 / YOUR TRAINING</span>
            </div>
          </section>
          <Section
            title="Your daily rhythm"
            action={
              <span className="muted small">
                {done.filter(Boolean).length} / 3 complete
              </span>
            }
          >
            <div className="checklist">
              {[
                {
                  label: "Log your meals",
                  sub: "A little awareness goes a long way.",
                  icon: Utensils,
                  tab: "Nutrition" as Tab,
                },
                {
                  label: "Record your weight",
                  sub: "Watch the trend, not a single number.",
                  icon: Weight,
                  tab: "Progress" as Tab,
                },
                {
                  label: today.ids.length
                    ? "Move your body"
                    : "Make space for recovery",
                  sub: today.ids.length
                    ? "One session closer to stronger."
                    : "Your rest day counts, too.",
                  icon: Dumbbell,
                  tab: "Training" as Tab,
                },
              ].map((item, i) => (
                <button
                  key={item.label}
                  className="checklist-row"
                  onClick={() => go(item.tab)}
                >
                  <span className={`check-box ${done[i] ? "checked" : ""}`}>
                    {done[i] ? <Check size={15} /> : <item.icon size={17} />}
                  </span>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.sub}</small>
                  </span>
                  <ArrowRight size={17} />
                </button>
              ))}
            </div>
          </Section>
          <div className="stats-grid">
            <div className="mini-stat">
              <div className="row between">
                <span>Workouts this week</span>
                <Dumbbell size={16} />
              </div>
              <strong>
                {sessions.length}
                <small> / {workoutDays}</small>
              </strong>
              <span className="muted">Last 7 days</span>
            </div>
            <div className="mini-stat">
              <div className="row between">
                <span>Average weight</span>
                <Activity size={16} />
              </div>
              <strong>
                {trend.current ? fmt(trend.current) : "—"}
                <small> kg</small>
              </strong>
              <span className="muted">
                {trend.change === null
                  ? "Build your baseline"
                  : `${trend.change > 0 ? "+" : ""}${fmt(trend.change)} kg vs last week`}
              </span>
            </div>
          </div>
        </div>
        <div className="dashboard-side">
          <Section
            title="Daily fuel"
            action={
              <button
                className="icon-btn"
                onClick={() => go("Nutrition")}
                aria-label="Open nutrition"
              >
                <ArrowUpRight size={18} />
              </button>
            }
          >
            <div
              className="calorie-ring"
              style={{ "--progress": `${progress}%` } as React.CSSProperties}
            >
              <div>
                <Utensils size={20} />
                <strong>{p.calories ? fmt(remaining) : "—"}</strong>
                <span>
                  {p.calories ? "kcal remaining" : "set your daily budget"}
                </span>
              </div>
            </div>
            <div className="fuel-numbers">
              <div>
                <strong>{fmt(totals.calories)}</strong>
                <span>Eaten</span>
              </div>
              <div>
                <strong>{p.calories ? fmt(p.calories) : "—"}</strong>
                <span>Budget</span>
              </div>
            </div>
            <div className="macro-list">
              <Meter label="Protein" value={totals.protein} max={p.protein} />
              <Meter label="Carbs" value={totals.carbs} max={p.carbs} />
              <Meter label="Fat" value={totals.fat} max={p.fat} />
            </div>
            <button
              className="secondary full"
              onClick={() => go(p.calories ? "Nutrition" : "Settings")}
            >
              <Plus size={16} />
              {p.calories ? "Log a meal" : "Set nutrition targets"}
            </button>
          </Section>
          <div className="coach-teaser">
            <span className="eyebrow">
              <Sparkles size={14} /> A LITTLE GUIDANCE
            </span>
            <h3>Your plan should fit your life.</h3>
            <p>Review your week, spot patterns, and decide what to adjust.</p>
            <LinkButton onClick={() => go("Coach")}>Meet your coach</LinkButton>
          </div>
        </div>
      </div>
    </>
  );
}
