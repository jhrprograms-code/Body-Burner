"use client";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  Check,
  Download,
  ExternalLink,
  LogOut,
  Shield,
  Trash2,
  UserRound,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { exportData } from "@/lib/store";
import { localPhoto } from "@/lib/photos";
import { emptyState, type Profile } from "@/lib/domain";
import type { StoreProps } from "./BodyBurner";
import { ErrorNote, Field, Heading, Modal, Section } from "./ui";
export default function Settings({
  state,
  setState,
  notify,
  user,
  onLogin,
  saveStatus,
}: StoreProps & {
  user: User | null;
  onLogin: () => void;
  saveStatus?: string;
}) {
  const [profile, setProfile] = useState<Profile>(state.profile),
    [error, setError] = useState(""),
    [erase, setErase] = useState(false),
    [phrase, setPhrase] = useState(""),
    [busy, setBusy] = useState(false);
  const change = (key: keyof Profile, value: string | number) =>
    setProfile((p) => ({ ...p, [key]: value }));
  async function eraseData() {
    setBusy(true);
    setError("");
    try {
      for (const photo of state.photos) {
        if (photo.path.startsWith("local:"))
          await localPhoto("delete", photo.id);
      }
      if (user && supabase) {
        const { data, error } = await supabase.storage
          .from("progress")
          .list(user.id, { limit: 1000 });
        if (error) throw error;
        if (data?.length) {
          const removed = await supabase.storage
            .from("progress")
            .remove(data.map((f) => `${user.id}/${f.name}`));
          if (removed.error) throw removed.error;
        }
        const deleted = await supabase.rpc("erase_state");
        if (deleted.error) throw deleted.error;
      } else localStorage.removeItem("body-burner-local-v1");
      location.reload();
    } catch {
      setError(
        "Some data could not be erased. Try again or contact the app owner.",
      );
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="MAKE IT YOURS"
        title="A plan that fits you."
        text="Your preferences set the direction. Your logs guide the progress."
      />
      <div className="settings-layout">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setState((s) => ({ ...s, profile }));
            notify("Preferences and targets saved");
          }}
        >
          <Section title="Your starting point">
            <Field label="First name">
              <input
                required
                maxLength={40}
                value={profile.name}
                onChange={(e) => change("name", e.target.value)}
                placeholder="What should we call you?"
              />
            </Field>
            <div className="form-grid">
              <Field label="Age">
                <input
                  required
                  type="number"
                  min="18"
                  max="100"
                  value={profile.age || ""}
                  onChange={(e) => change("age", Number(e.target.value))}
                />
              </Field>
              <Field label="Sex (optional context)">
                <select
                  value={profile.sex}
                  onChange={(e) => change("sex", e.target.value)}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other / prefer not to say</option>
                </select>
              </Field>
              <Field label="Height (cm)">
                <input
                  required
                  type="number"
                  min="120"
                  max="230"
                  step="0.1"
                  value={profile.height || ""}
                  onChange={(e) => change("height", Number(e.target.value))}
                />
              </Field>
              <Field label="Starting weight (kg)">
                <input
                  required
                  type="number"
                  min="30"
                  max="400"
                  step="0.1"
                  value={profile.weight || ""}
                  onChange={(e) => change("weight", Number(e.target.value))}
                />
              </Field>
            </div>
            <Field label="Your main goal">
              <select
                value={profile.goal}
                onChange={(e) => change("goal", e.target.value)}
              >
                <option value="lose">Lose fat while building strength</option>
                <option value="maintain">
                  Maintain weight and get stronger
                </option>
                <option value="build">Build muscle</option>
              </select>
            </Field>
            <p className="muted small">
              For adults. Body photos do not set your calorie needs or training
              weights.
            </p>
          </Section>
          <Section title="Your training rhythm">
            <div className="form-grid">
              <Field label="Lifting days per week">
                <select
                  value={profile.days}
                  onChange={(e) => change("days", Number(e.target.value))}
                >
                  <option value="3">3 — Full body</option>
                  <option value="4">4 — Upper / lower</option>
                  <option value="5">
                    5 — Upper / lower + push / pull / legs
                  </option>
                </select>
              </Field>
              <Field label="Available equipment">
                <select
                  value={profile.equipment}
                  onChange={(e) => change("equipment", e.target.value)}
                >
                  <option value="gym">Full gym</option>
                  <option value="dumbbells">Dumbbells + bench</option>
                  <option value="bodyweight">Bodyweight only</option>
                </select>
              </Field>
            </div>
            <Field label="Training experience">
              <select
                value={profile.experience}
                onChange={(e) => change("experience", e.target.value)}
              >
                <option value="new">New / returning — start with 2 sets</option>
                <option value="regular">
                  Regular lifting — start with 3 sets
                </option>
              </select>
            </Field>
            <Field
              label="Limitations or movements to review"
              hint="The starter template cannot assess or rehabilitate injuries. Discuss limitations with a qualified professional."
            >
              <textarea
                maxLength={500}
                value={profile.limitations}
                onChange={(e) => change("limitations", e.target.value)}
                placeholder="Optional notes about comfort, equipment or medical advice…"
              />
            </Field>
          </Section>
          <Section title="Nutrition targets">
            <p className="muted">
              Enter targets you have chosen. The app tracks against them and
              never cuts calories automatically.
            </p>
            <div className="form-grid">
              {(["calories", "protein", "carbs", "fat"] as const).map((key) => (
                <Field
                  key={key}
                  label={`${key[0].toUpperCase() + key.slice(1)} per day (${key === "calories" ? "kcal" : "g"})`}
                >
                  <input
                    type="number"
                    min={key === "calories" ? 1200 : 0}
                    max={key === "calories" ? 6000 : 1000}
                    step="1"
                    placeholder="Not set"
                    value={profile[key] || ""}
                    onChange={(e) => change(key, Number(e.target.value))}
                  />
                </Field>
              ))}
            </div>
            <p className="muted small">
              Optional: leave targets blank while collecting a baseline. Macro
              calories can differ from label calories because of fibre and
              rounding.
            </p>
            <div className="notice">
              A week or two of consistent food and weight logs is more useful
              than guessing from gym frequency. Three meals are included; log
              snacks under the closest meal.
            </div>
          </Section>
          <button className="primary full sticky-save" type="submit">
            <Check size={18} />
            Save preferences
          </button>
        </form>
        <aside>
          <Section title="Account & privacy">
            <div className="account-status">
              <Shield size={24} strokeWidth={1.5} />
              <strong>{user ? "Connected privately" : "Local mode"}</strong>
              <p>
                {user?.email ||
                  "Your journal stays in this browser. Sign in to use cloud sync, food databases and AI."}
              </p>
            </div>
            {user ? (
              <button
                className="secondary full"
                disabled={saveStatus === "Saving…"}
                onClick={async () => {
                  await supabase?.auth.signOut();
                  notify("Signed out");
                }}
              >
                <LogOut size={16} />
                Sign out
              </button>
            ) : (
              <button className="primary full" onClick={onLogin}>
                <UserRound size={17} />
                Sign in
              </button>
            )}
            <p className="muted small">
              Local and account journals are separate. Export local records
              before switching if you want to keep a backup.
            </p>
          </Section>
          <Section title="Your data, your control">
            <button
              className="secondary full"
              onClick={() => exportData(state)}
            >
              <Download size={17} />
              Export journal (JSON)
            </button>
            <p className="muted small">
              Includes meals, workout history, measurements and photo
              references. Image files must be backed up separately.
            </p>
            <button
              className="text-btn danger"
              disabled={saveStatus === "Saving…"}
              onClick={() => setErase(true)}
            >
              <Trash2 size={16} />
              Erase my journal
            </button>
            <p className="muted small">
              To remove your sign-in account as well, ask the app owner to
              delete it from Supabase Auth.
            </p>
          </Section>
          <Section title="About this first release">
            <div className="settings-fact">
              <span>Language</span>
              <strong>English</strong>
            </div>
            <div className="settings-fact">
              <span>Units</span>
              <strong>kg · cm · kcal</strong>
            </div>
            <div className="settings-fact">
              <span>Exercise catalogue</span>
              <strong>200 movements</strong>
            </div>
            <div className="settings-fact">
              <span>Media</span>
              <strong>Licensed import</strong>
            </div>
            <p className="muted small">
              Body Burner gives general fitness guidance. AI estimates need
              review and cannot diagnose health conditions.
            </p>
          </Section>
        </aside>
      </div>
      {erase && (
        <Modal title="Erase your journal?" onClose={() => setErase(false)}>
          <p>
            This permanently removes your meals, workouts, measurements,
            check-ins and stored progress photos from this{" "}
            {user ? "account" : "device"}. Export a backup first if you want
            one.
          </p>
          <Field label="Type ERASE to confirm">
            <input
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              autoComplete="off"
            />
          </Field>
          <ErrorNote message={error} />
          <button
            className="primary full"
            disabled={phrase !== "ERASE" || busy}
            onClick={eraseData}
          >
            {busy ? "Erasing…" : "Erase my journal"}
          </button>
        </Modal>
      )}
    </>
  );
}
