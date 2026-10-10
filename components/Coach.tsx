"use client";
import { useState } from "react";
import { ArrowUp, Check, MessageCircle, Plus, Sparkles } from "lucide-react";
import { api } from "@/lib/supabase";
import { dayKey, uid, weeklyReview } from "@/lib/domain";
import type { StoreProps } from "./BodyBurner";
import { ErrorNote, Field, Heading, Modal, Section } from "./ui";
export default function Coach({ state, setState, notify }: StoreProps) {
  const [text, setText] = useState(""),
    [messages, setMessages] = useState<{ role: string; text: string }[]>([]),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [checkin, setCheckin] = useState(false);
  const review = weeklyReview(state);
  async function send() {
    if (!text.trim() || busy) return;
    const question = text;
    setText("");
    setBusy(true);
    setError("");
    setMessages((m) => [...m, { role: "you", text: question }]);
    try {
      const data = await api("/api/ai", {
        method: "POST",
        body: JSON.stringify({
          mode: "coach",
          text: question,
          consent,
          history: messages.slice(-6).map((m) => ({
            role: m.role === "you" ? "user" : "assistant",
            text: m.text.slice(0, 1500),
          })),
        }),
      });
      setMessages((m) => [...m, { role: "coach", text: data.reply }]);
    } catch (e) {
      setError((e as Error).message);
      setText(question);
      setMessages((m) => (m.at(-1)?.role === "you" ? m.slice(0, -1) : m));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="A LITTLE CLARITY GOES A LONG WAY"
        title="In your corner."
        text="Understand your progress. Choose your next step."
        action={
          <button className="secondary" onClick={() => setCheckin(true)}>
            <Plus size={17} />
            Weekly check-in
          </button>
        }
      />
      <div className="coach-layout">
        <section className="panel chat-panel">
          <div className="coach-header">
            <div className="coach-avatar">
              <Sparkles size={24} />
            </div>
            <div>
              <h2>Body Burner coach</h2>
              <span className="muted small">
                General fitness guidance · powered by Gemini
              </span>
            </div>
          </div>
          <div className="messages" aria-live="polite">
            {!messages.length ? (
              <div className="coach-welcome">
                <Sparkles size={33} strokeWidth={1.3} />
                <h2>Let’s make sense of your week.</h2>
                <p>
                  Ask about your routine, meals, recovery or progress. The coach
                  can use your saved logs when you choose to share them.
                </p>
                <div className="prompt-grid">
                  {[
                    "Why has my weight stayed the same?",
                    "How should I progress my weights?",
                    "Help me plan balanced Costco meals.",
                    "How do I balance lifting and cardio?",
                  ].map((p) => (
                    <button
                      className="prompt"
                      key={p}
                      onClick={() => setText(p)}
                    >
                      {p}
                      <ArrowUp size={15} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div className={`message ${m.role}`} key={i}>
                  <span>{m.role === "you" ? "YOU" : "BODY BURNER"}</span>
                  <p>{m.text}</p>
                </div>
              ))
            )}
            {busy && <p className="muted">Thinking through your question…</p>}
          </div>
          <div className="chat-compose">
            <ErrorNote message={error} />
            <label className="checkbox-label small">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              Share this question and a summary of my saved profile and recent
              logs with Google Gemini. Photos are excluded.
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <textarea
                aria-label="Ask your coach"
                rows={2}
                maxLength={3000}
                disabled={busy}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What’s on your mind?"
              />
              <button
                className="send-button"
                aria-label="Send question"
                disabled={!consent || !text.trim() || busy}
              >
                <ArrowUp size={20} />
              </button>
            </form>
            <small>
              Suggestions are yours to accept. The coach doesn’t change your
              plan or targets.
            </small>
          </div>
        </section>
        <aside>
          <Section
            title="Your weekly snapshot"
            action={<span className="pill">ON DEVICE</span>}
          >
            <div className="review-stats">
              <div>
                <strong>{review.sessions}</strong>
                <span>workouts</span>
              </div>
              <div>
                <strong>{review.mealDays}</strong>
                <span>days with food logs</span>
              </div>
            </div>
            <p>{review.message}</p>
            <p className="muted small">{review.note}</p>
            <button className="secondary full" onClick={() => setCheckin(true)}>
              Reflect on your week
              <ArrowUp size={15} />
            </button>
          </Section>
          <Section title="Recent check-ins">
            {state.checkins.length ? (
              [...state.checkins]
                .reverse()
                .slice(0, 4)
                .map((c) => (
                  <div className="checkin-entry" key={c.id}>
                    <strong>{c.date}</strong>
                    <p>
                      {c.sleep} h sleep · Energy {c.energy}/5 · Hunger{" "}
                      {c.hunger}/5
                    </p>
                    {c.notes && <p className="muted">{c.notes}</p>}
                  </div>
                ))
            ) : (
              <p className="muted">
                Your first check-in is a chance to notice what’s working, and
                what could feel easier.
              </p>
            )}
          </Section>
          <div className="coach-note">
            <h3>Evidence, with perspective.</h3>
            <p>
              Consistency, progressive resistance training, adequate protein and
              recovery form the foundation. Your response and preferences guide
              the adjustments.
            </p>
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/28698222/"
              target="_blank"
              rel="noreferrer"
            >
              Read the protein + resistance training review ↗
            </a>
          </div>
        </aside>
      </div>
      {checkin && (
        <Modal
          title="How did this week feel?"
          onClose={() => setCheckin(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setState((s) => ({
                ...s,
                checkins: [
                  ...s.checkins.filter((c) => c.date !== dayKey()),
                  {
                    id: uid(),
                    date: dayKey(),
                    sleep: Number(f.get("sleep")),
                    energy: Number(f.get("energy")),
                    hunger: Number(f.get("hunger")),
                    notes: String(f.get("notes") || ""),
                  },
                ],
              }));
              setCheckin(false);
              notify("Weekly check-in saved");
            }}
          >
            <Field label="Average sleep (hours)">
              <input
                name="sleep"
                type="number"
                min="0"
                max="16"
                step="0.5"
                required
                defaultValue="7"
              />
            </Field>
            <div className="form-grid">
              <Field label="Energy (1 low – 5 high)">
                <select name="energy" defaultValue="3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </Field>
              <Field label="Hunger (1 low – 5 high)">
                <select name="hunger" defaultValue="3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="What worked? What would you change?">
              <textarea
                name="notes"
                maxLength={1000}
                rows={4}
                placeholder="Small wins, hard days, and anything you want to remember…"
              />
            </Field>
            <button className="primary full">
              <Check size={17} />
              Save check-in
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
