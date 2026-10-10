"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  Activity,
  Camera,
  Check,
  Plus,
  Ruler,
  Trash2,
  TrendingDown,
  Weight,
} from "lucide-react";
import {
  dayKey,
  dateOffset,
  fmt,
  uid,
  weightTrend,
  type Measurement,
} from "@/lib/domain";
import { ProgressHighlights } from "./WellnessCards";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/store";
import { localPhoto } from "@/lib/photos";
import type { StoreProps } from "./BodyBurner";
import { Empty, ErrorNote, Field, Heading, Modal, Section } from "./ui";
export default function Progress({
  state,
  setState,
  notify,
  user,
}: StoreProps & { user: User | null }) {
  const [modal, setModal] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [urls, setUrls] = useState<Record<string, string>>({}),
    [photoDate, setPhotoDate] = useState(dayKey()),
    [remove, setRemove] = useState<string | null>(null);
  const [range, setRange] = useState(30);
  const entries = [...state.measurements].sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
    last = entries.at(-1),
    trend = weightTrend(entries, dayKey());
  useEffect(() => {
    let alive = true;
    (async () => {
      const next: Record<string, string> = {};
      for (const photo of state.photos) {
        try {
          if (photo.path.startsWith("local:")) {
            const data = await localPhoto("get", photo.id);
            if (data) next[photo.id] = data;
          } else if (supabase && user) {
            const { data, error } = await supabase.storage
              .from("progress")
              .createSignedUrl(photo.path, 3600);
            if (error) throw error;
            if (data) next[photo.id] = data.signedUrl;
          }
        } catch {
          if (alive)
            setError(
              "Some photos could not be loaded. Reopen Progress to refresh access.",
            );
        }
      }
      if (alive) setUrls(next);
    })();
    return () => {
      alive = false;
    };
  }, [state.photos, user]);
  async function upload(file: File) {
    setError("");
    setBusy(true);
    try {
      if (state.photos.length >= 24)
        throw new Error(
          "Your album holds 24 photos. Remove an older photo before adding another.",
        );
      const image = await compressImage(file),
        id = uid();
      let path = `local:${id}`;
      if (user && supabase) {
        path = `${user.id}/${id}.jpg`;
        const blob = await (await fetch(image)).blob();
        const { error } = await supabase.storage
          .from("progress")
          .upload(path, blob, { contentType: "image/jpeg", upsert: false });
        if (error)
          throw new Error(
            "Photo upload failed. Check your connection and account setup.",
          );
      } else await localPhoto("put", id, image);
      setState((s) => ({
        ...s,
        photos: [...s.photos, { id, date: photoDate, path }],
      }));
      notify(user ? "Photo saved privately" : "Photo saved on this device");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function deletePhoto(id: string) {
    try {
      const photo = state.photos.find((p) => p.id === id);
      if (!photo) return;
      if (photo.path.startsWith("local:")) await localPhoto("delete", id);
      else if (supabase) {
        const { error } = await supabase.storage
          .from("progress")
          .remove([photo.path]);
        if (error) throw new Error("Could not delete photo. Please try again.");
      }
      setState((s) => ({ ...s, photos: s.photos.filter((p) => p.id !== id) }));
      setRemove(null);
      notify("Photo removed");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <Heading
        eyebrow="THE BIGGER PICTURE"
        title="Progress beyond the scale."
        text="Look for patterns. Celebrate consistency."
        action={
          <button className="primary" onClick={() => setModal(true)}>
            <Plus size={17} />
            Log a measurement
          </button>
        }
      />
      <ProgressHighlights {...{ state, setState, notify }} />
      <div className="progress-stats">
        <div className="mini-stat">
          <div className="row between">
            <span>Latest weight</span>
            <Weight size={17} />
          </div>
          <strong>
            {last ? fmt(last.weight) : "—"}
            <small> kg</small>
          </strong>
          <span className="muted">
            {last?.date || "Your baseline starts here"}
          </span>
        </div>
        <div className="mini-stat">
          <div className="row between">
            <span>7-day average</span>
            <Activity size={17} />
          </div>
          <strong>
            {trend.current ? fmt(trend.current) : "—"}
            <small> kg</small>
          </strong>
          <span className="muted">
            {trend.change === null
              ? "More weigh-ins needed"
              : `${trend.change > 0 ? "+" : ""}${fmt(trend.change)} kg from last week`}
          </span>
        </div>
        <div className="mini-stat">
          <div className="row between">
            <span>Latest waist</span>
            <Ruler size={17} />
          </div>
          <strong>
            {[...entries].reverse().find((m) => m.waist)?.waist || "—"}
            <small> cm</small>
          </strong>
          <span className="muted">Same time, same measuring point</span>
        </div>
      </div>
      <Section
        title="Your weight over time"
        action={
          <select
            aria-label="Weight chart time range"
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
          >
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={180}>6 months</option>
            <option value={365}>1 year</option>
            <option value={0}>All time</option>
          </select>
        }
      >
        <WeightChart
          entries={entries.filter(
            (m) =>
              m.date <= dayKey() &&
              (!range || m.date >= dateOffset(dayKey(), -range)),
          )}
        />
        <p className="muted small">
          Use similar morning conditions. Water, food, salt and creatine can
          move the scale independently of fat.
        </p>
      </Section>
      <div className="progress-columns">
        <Section
          title="Measurement journal"
          action={
            <button className="text-btn" onClick={() => setModal(true)}>
              <Plus size={15} />
              Add
            </button>
          }
        >
          {entries.length ? (
            <div className="measurement-table">
              <div className="measurement-row labels">
                <span>DATE</span>
                <span>WEIGHT</span>
                <span>WAIST</span>
                <span />
              </div>
              {[...entries]
                .reverse()
                .slice(0, 30)
                .map((m) => (
                  <div className="measurement-row" key={m.id}>
                    <span>{m.date}</span>
                    <strong>{fmt(m.weight)} kg</strong>
                    <span>{m.waist ? `${fmt(m.waist)} cm` : "—"}</span>
                    <button
                      className="icon-btn"
                      aria-label={`Delete measurement for ${m.date}`}
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          measurements: s.measurements.filter(
                            (x) => x.id !== m.id,
                          ),
                        }))
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
            </div>
          ) : (
            <Empty
              icon={<Weight size={26} />}
              headline="Every trend starts with one entry."
              text="Log weight a few mornings each week. Waist measurements are optional."
            />
          )}
        </Section>
        <Section title="A fair comparison">
          <div className="tip-number">01</div>
          <h3>Give changes time to show.</h3>
          <p className="muted">
            Pair the weight trend with your waist measurements, workout
            performance, energy and how your clothes fit.
          </p>
          <div className="divider" />
          <h3>Photos are a progress tool.</h3>
          <p className="muted">
            Use the same lighting, pose and distance. Photos can’t provide a
            reliable body-fat percentage or tell us what weights you should
            lift.
          </p>
        </Section>
      </div>
      <Section
        title="Your private photo journal"
        action={
          <span className="muted small">{state.photos.length} / 24 photos</span>
        }
      >
        <p className="muted">
          Compare changes side by side. These images stay in your private album
          and are never sent to the AI coach.
        </p>
        <div className="row wrap">
          <Field label="Photo date">
            <input
              type="date"
              max={dayKey()}
              required
              value={photoDate}
              onChange={(e) => e.target.value && setPhotoDate(e.target.value)}
            />
          </Field>
          <label className="secondary upload-button">
            <Camera size={17} />
            {busy ? "Saving photo…" : "Add progress photo"}
            <input
              disabled={busy}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                if (e.target.files?.[0]) upload(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <ErrorNote message={error} />
        <div className="photo-grid">
          {[...state.photos]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((p) => (
              <div className="progress-photo" key={p.id}>
                {urls[p.id] ? (
                  <img
                    src={urls[p.id]}
                    alt={`Private progress photo taken ${p.date}`}
                  />
                ) : (
                  <div className="photo-loading">Loading photo…</div>
                )}
                <div className="row between">
                  <span>{p.date}</span>
                  <button
                    className="icon-btn"
                    aria-label={`Delete photo ${p.date}`}
                    onClick={() => setRemove(p.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
        </div>
        {!state.photos.length && (
          <div className="photo-empty">
            <Camera size={25} />
            <span>Your story, at your pace.</span>
          </div>
        )}
        <p className="muted small">
          {user
            ? "Photos use private, expiring links. Download originals separately if you want an external backup."
            : "Local photos stay in this browser. Clearing site storage removes them; signing in opens a separate cloud journal."}
        </p>
      </Section>
      {modal && (
        <Modal title="A moment to check in" onClose={() => setModal(false)}>
          <MeasurementForm
            entries={entries}
            onSave={(m) => {
              setState((s) => ({
                ...s,
                measurements: [
                  ...s.measurements.filter((x) => x.date !== m.date),
                  m,
                ],
              }));
              setModal(false);
              notify("Measurement saved");
            }}
          />
        </Modal>
      )}
      {remove && (
        <Modal
          title="Delete this progress photo?"
          onClose={() => setRemove(null)}
        >
          <p className="muted">
            This removes the stored image and its album entry.
          </p>
          <button className="primary full" onClick={() => deletePhoto(remove)}>
            Delete photo
          </button>
        </Modal>
      )}
    </>
  );
}
function MeasurementForm({
  onSave,
  entries,
}: {
  onSave: (m: Measurement) => void;
  entries: Measurement[];
}) {
  const [date, setDate] = useState(dayKey());
  const existing = entries.find((m) => m.date === date);
  return (
    <form
      key={date}
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        onSave({
          id: existing?.id || uid(),
          date,
          weight: Number(f.get("weight")),
          waist: f.get("waist") ? Number(f.get("waist")) : undefined,
          steps: f.get("steps") ? Number(f.get("steps")) : undefined,
          notes: String(f.get("notes") || ""),
        });
      }}
    >
      <Field label="Date">
        <input
          type="date"
          required
          max={dayKey()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Field>
      <div className="form-grid">
        <Field label="Weight (kg)">
          <input
            autoFocus
            name="weight"
            type="number"
            step="0.1"
            min="30"
            max="400"
            required
            defaultValue={existing?.weight || ""}
          />
        </Field>
        <Field label="Waist (cm, optional)">
          <input
            name="waist"
            type="number"
            step="0.1"
            min="40"
            max="250"
            defaultValue={existing?.waist || ""}
          />
        </Field>
      </div>
      <Field label="Steps (optional)">
        <input
          name="steps"
          type="number"
          min="0"
          max="100000"
          step="1"
          defaultValue={existing?.steps ?? ""}
        />
      </Field>
      <Field label="Notes">
        <textarea
          name="notes"
          maxLength={500}
          defaultValue={existing?.notes || ""}
          placeholder="Sleep, soreness, travel, or anything worth remembering…"
        />
      </Field>
      {existing && (
        <p className="notice">Saving will replace this day’s measurement.</p>
      )}
      <button className="primary full">
        <Check size={17} />
        Save measurement
      </button>
    </form>
  );
}
function WeightChart({ entries }: { entries: Measurement[] }) {
  if (entries.length < 2)
    return (
      <Empty
        icon={<Activity size={32} />}
        headline="The trend tells the story."
        text="Add at least two measurements to see your chart. Weekly averages become more useful with consistent entries."
      />
    );
  const values = entries.map((e) => e.weight),
    lo = Math.min(...values) - 0.5,
    hi = Math.max(...values) + 0.5;
  const width = 800,
    height = 230,
    pad = 35;
  const start = new Date(entries[0].date).getTime(),
    end = new Date(entries.at(-1)!.date).getTime();
  const points = entries.map((e) => ({
    x:
      pad +
      ((new Date(e.date).getTime() - start) / Math.max(1, end - start)) *
        (width - pad * 2),
    y: height - pad - ((e.weight - lo) / (hi - lo)) * (height - pad * 2),
    e,
  }));
  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <div className="chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Weight trend from ${entries[0].date} to ${entries.at(-1)?.date}. ${fmt(values[0])} to ${fmt(values.at(-1)!)} kilograms.`}
      >
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line
              x1={pad}
              x2={width - pad}
              y1={pad + t * (height - pad * 2)}
              y2={pad + t * (height - pad * 2)}
              stroke="#2b2b2b"
              strokeDasharray="3 6"
            />
            <text
              x="0"
              y={pad + t * (height - pad * 2) + 4}
              fill="#8c8c8c"
              fontSize="12"
            >
              {fmt(hi - t * (hi - lo))}
            </text>
          </g>
        ))}
        <defs>
          <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity=".13" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`${pad},${height - pad} ${line} ${width - pad},${height - pad}`}
          fill="url(#areaFill)"
        />
        <polyline points={line} stroke="#eeeeee" strokeWidth="2" fill="none" />
        {points.map((p) => (
          <circle
            key={p.e.id}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#111"
            stroke="#eee"
            strokeWidth="2"
          >
            <title>
              {p.e.date}: {p.e.weight} kg
            </title>
          </circle>
        ))}
      </svg>
      <div className="row between muted small">
        <span>{entries[0].date}</span>
        <span>{entries.at(-1)?.date}</span>
      </div>
    </div>
  );
}
