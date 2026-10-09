"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Plus,
  ScanBarcode,
  Search,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { api } from "@/lib/supabase";
import { compressImage } from "@/lib/store";
import { commonFoods } from "@/data/common-foods";
import { foodIcon } from "@/lib/food-icons";
import {
  dayKey,
  dateOffset,
  fmt,
  scaleFood,
  totalFoods,
  uid,
  type Food,
  type MealName,
  type Nutrients,
} from "@/lib/domain";
import type { StoreProps } from "./BodyBurner";
import { Empty, ErrorNote, Field, Heading, Meter, Modal, Section } from "./ui";
const meals: MealName[] = ["Breakfast", "Lunch", "Dinner"];
export default function Nutrition({
  state,
  setState,
  notify,
  date,
  setDate,
}: StoreProps & { date: string; setDate: (s: string) => void }) {
  const [add, setAdd] = useState<MealName | null>(null);
  const foods = state.foods.filter((f) => f.date === date),
    total = totalFoods(foods),
    p = state.profile;
  return (
    <>
      <Heading
        eyebrow="NOURISH YOUR PROGRESS"
        title="Make every meal count."
        text="Good food. Clear numbers. Room for real life."
        action={
          <button className="primary" onClick={() => setAdd("Breakfast")}>
            <Plus size={17} />
            Log food
          </button>
        }
      />
      <div className="date-toolbar">
        <button
          className="icon-btn"
          aria-label="Previous day"
          onClick={() => setDate(dateOffset(date, -1))}
        >
          <ChevronLeft size={18} />
        </button>
        <input
          aria-label="Nutrition date"
          type="date"
          max={dayKey()}
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
        />
        <button
          className="icon-btn"
          disabled={date >= dayKey()}
          aria-label="Next day"
          onClick={() => setDate(dateOffset(date, 1))}
        >
          <ChevronRight size={18} />
        </button>
        <button className="text-btn" onClick={() => setDate(dayKey())}>
          Today
        </button>
      </div>
      <section className="panel nutrition-summary">
        <div className="budget-main">
          <span className="eyebrow">TODAY’S ENERGY</span>
          <div>
            <strong>{fmt(total.calories)}</strong>
            <span> / {p.calories ? fmt(p.calories) : "—"} kcal</span>
          </div>
          <p>
            {p.calories
              ? `${fmt(Math.abs(p.calories - total.calories))} kcal ${total.calories > p.calories ? "above budget" : "remaining"}`
              : "Set your calorie and macro targets in Settings."}
          </p>
          <div className="track">
            <span
              style={{
                width: `${p.calories ? Math.min(100, (total.calories / p.calories) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
        <div className="nutrition-macros">
          <Meter label="Protein" value={total.protein} max={p.protein} />
          <Meter label="Carbs" value={total.carbs} max={p.carbs} />
          <Meter label="Fat" value={total.fat} max={p.fat} />
        </div>
      </section>
      <div className="food-layout">
        <div className="meal-list">
          {meals.map((meal, i) => {
            const entries = foods.filter((f) => f.meal === meal),
              totals = totalFoods(entries);
            return (
              <Section
                key={meal}
                title={meal}
                action={
                  <div className="row">
                    <span className="muted small">
                      {fmt(totals.calories)} kcal
                    </span>
                    <button
                      className="icon-btn"
                      aria-label={`Add ${meal.toLowerCase()}`}
                      onClick={() => setAdd(meal)}
                    >
                      <Plus size={19} />
                    </button>
                  </div>
                }
              >
                <div className="meal-caption">
                  0{i + 1} /{" "}
                  {["START YOUR DAY", "KEEP YOUR MOMENTUM", "FINISH WELL"][i]}
                </div>
                {!entries.length ? (
                  <button className="meal-empty" onClick={() => setAdd(meal)}>
                    <span className="food-icon">
                      <Utensils size={20} />
                    </span>
                    <span>
                      <strong>A fresh plate.</strong>
                      <small>Add food, scan a barcode or take a photo.</small>
                    </span>
                    <Plus size={18} />
                  </button>
                ) : (
                  entries.map((food) => (
                    <div className="food-row" key={food.entryId}>
                      <span className="food-icon food-emoji" aria-hidden="true">
                        {foodIcon(food.name)}
                      </span>
                      <div className="food-detail">
                        <strong>{food.name}</strong>
                        <small>
                          {fmt(food.grams)} {food.unit || "g"} ·{" "}
                          {fmt(food.protein)} g protein · {food.source}
                        </small>
                      </div>
                      <strong className="food-calories">
                        {fmt(food.calories)}
                        <small>kcal</small>
                      </strong>
                      <button
                        className="icon-btn"
                        title="Save this meal"
                        aria-label={`Save ${food.name}`}
                        onClick={() => {
                          setState((s) => ({
                            ...s,
                            savedFoods: [
                              ...s.savedFoods.filter((x) => x.id !== food.id),
                              food,
                            ],
                          }));
                          notify("Saved to your meals");
                        }}
                      >
                        <Bookmark size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        aria-label={`Delete ${food.name}`}
                        onClick={() =>
                          setState((s) => ({
                            ...s,
                            foods: s.foods.filter(
                              (f) => f.entryId !== food.entryId,
                            ),
                          }))
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </Section>
            );
          })}
        </div>
        <aside>
          <div className="panel quick-capture">
            <div className="capture-icon">
              <Camera size={30} strokeWidth={1.5} />
            </div>
            <span className="eyebrow">LESS TYPING. MORE LIVING.</span>
            <h2>Snap. Review. Log.</h2>
            <p>
              Turn a meal photo into an editable estimate. You know your
              portions best.
            </p>
            <button className="primary full" onClick={() => setAdd("Lunch")}>
              <Camera size={17} />
              Add a meal photo
            </button>
            <small>Oil, sauces and portion sizes need your review.</small>
          </div>
          <div className="panel grocery-card">
            <h3>Your Costco staples</h3>
            <p>
              Search Kirkland products or scan the package. Canadian labels can
              differ from other regions.
            </p>
            <button className="secondary full" onClick={() => setAdd("Dinner")}>
              <Search size={16} />
              Find a food
            </button>
          </div>
        </aside>
      </div>
      {add && (
        <FoodModal
          {...{ state, setState, notify }}
          meal={add}
          date={date}
          onClose={() => setAdd(null)}
        />
      )}
    </>
  );
}
function FoodModal({
  state,
  setState,
  notify,
  meal,
  date,
  onClose,
}: StoreProps & { meal: MealName; date: string; onClose: () => void }) {
  const [mode, setMode] = useState("Foods"),
    [query, setQuery] = useState(""),
    [provider, setProvider] = useState("off"),
    [results, setResults] = useState<Food[]>([]),
    [note, setNote] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState<Food | null>(null),
    [scanner, setScanner] = useState(false),
    [barcode, setBarcode] = useState(""),
    [mealName, setMealName] = useState<MealName>(meal);
  const search = async (code?: string) => {
    setError("");
    setBusy(true);
    try {
      const data = await api(
        `/api/foods?${code ? `barcode=${encodeURIComponent(code)}` : `q=${encodeURIComponent(query)}&provider=${provider}`}`,
      );
      setResults(data.foods);
      setNote(data.note);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const log = (foods: Food[]) => {
    setState((s) => ({
      ...s,
      foods: [
        ...s.foods,
        ...foods.map((f) => ({ ...f, date, meal: mealName, entryId: uid() })),
      ],
    }));
    notify(
      `${foods.length === 1 ? foods[0].name : "Meal"} added to ${mealName.toLowerCase()}`,
    );
    onClose();
  };
  return (
    <Modal title={`Fuel your day`} onClose={onClose} wide>
      <div className="row between">
        <span className="muted small">{date}</span>
        <select
          aria-label="Meal"
          value={mealName}
          onChange={(e) => setMealName(e.target.value as MealName)}
        >
          {meals.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="nutrition-actions" aria-label="Food logging methods">
        {[
          ["Barcode", "Barcode", <ScanBarcode key="barcode" size={18} />],
          ["AI Scan", "Photo / describe", <Camera key="camera" size={18} />],
          ["Describe", "Photo / describe", <Utensils key="describe" size={18} />],
          ["Quick log", "Manual", <Plus key="quick" size={18} />],
        ].map(([label, target, icon]) => (
          <button key={label as string} onClick={() => setMode(target as string)}>
            {icon}{label}
          </button>
        ))}
      </div>
      <div className="tab-pills">
        {["Foods", "Search", "Saved", "Manual", "Photo / describe"].map(
          (t) => (
            <button
              className={mode === t ? "active" : ""}
              key={t}
              onClick={() => {
                setMode(t);
                setSelected(null);
                setError("");
                setResults([]);
                setNote("");
              }}
            >
              {t}
            </button>
          ),
        )}
      </div>
      {selected ? (
        <>
          <button className="text-btn" onClick={() => setSelected(null)}>
            <ArrowLeft size={16} />
            Back to results
          </button>
          <FoodEditor food={selected} onSave={(f) => log([f])} />
        </>
      ) : (
        <>
          {mode === "Foods" && (
            <FoodLibrary state={state} onSelect={setSelected} />
          )}
          {(mode === "Search" || mode === "Barcode") && (
            <>
              <form
                className="search-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  search(mode === "Barcode" ? barcode : undefined);
                }}
              >
                <div className="search-input">
                  <Search size={18} />
                  <input
                    autoFocus
                    aria-label={
                      mode === "Search" ? "Search foods" : "Barcode number"
                    }
                    placeholder={
                      mode === "Search"
                        ? "Try Kirkland, chicken, banana…"
                        : "Enter the barcode digits"
                    }
                    value={mode === "Search" ? query : barcode}
                    inputMode={mode === "Barcode" ? "numeric" : "search"}
                    onChange={(e) =>
                      mode === "Search"
                        ? setQuery(e.target.value)
                        : setBarcode(e.target.value)
                    }
                    required
                    minLength={mode === "Barcode" ? 8 : 2}
                  />
                </div>
                <button className="primary" disabled={busy}>
                  {busy ? "Searching…" : "Search"}
                </button>
              </form>
              {mode === "Search" ? (
                <div className="row wrap small">
                  <label className="radio">
                    <input
                      type="radio"
                      checked={provider === "off"}
                      onChange={() => setProvider("off")}
                    />
                    Packaged foods
                  </label>
                  <label className="radio">
                    <input
                      type="radio"
                      checked={provider === "usda"}
                      onChange={() => setProvider("usda")}
                    />
                    Whole foods / USDA
                  </label>
                  <button
                    className="text-btn"
                    onClick={() => {
                      setQuery("Kirkland");
                      setProvider("off");
                    }}
                  >
                    Costco shortcut
                  </button>
                </div>
              ) : (
                <button className="secondary" onClick={() => setScanner(true)}>
                  <ScanBarcode size={18} />
                  Scan with camera
                </button>
              )}
              <ErrorNote message={error} />
              {note && <p className="notice small">{note}</p>}
              <div className="search-results">
                {results.map((food) => (
                  <button
                    key={food.id}
                    className="result-row"
                    onClick={() => setSelected(food)}
                  >
                    <span className="food-icon food-emoji" aria-hidden="true">
                      {foodIcon(food.name)}
                    </span>
                    <span>
                      <strong>{food.name}</strong>
                      <small>
                        {food.brand || food.source} · {food.basis}
                      </small>
                    </span>
                    <span>
                      {fmt(food.calories)}
                      <small>kcal</small>
                    </span>
                    <Plus size={17} />
                  </button>
                ))}
              </div>
              {!results.length && !busy && !note && (
                <Empty
                  icon={<Search size={25} />}
                  headline={
                    mode === "Search"
                      ? "Find your everyday favourites."
                      : "Start with the package."
                  }
                  text={
                    mode === "Search"
                      ? "Search packaged foods worldwide, or USDA for fruit, vegetables and other whole foods."
                      : "Use your camera or enter the number under the barcode."
                  }
                />
              )}
              <p className="attribution">
                Food data:{" "}
                <a
                  href="https://world.openfoodfacts.org"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Food Facts (ODbL)
                </a>{" "}
                and{" "}
                <a
                  href="https://fdc.nal.usda.gov"
                  target="_blank"
                  rel="noreferrer"
                >
                  USDA FoodData Central (CC0)
                </a>
                . Check product labels; coverage varies.
              </p>
            </>
          )}
          {mode === "Manual" && <FoodEditor onSave={(f) => log([f])} />}
          {mode === "Saved" && (
            <>
              {state.savedFoods.length ? (
                state.savedFoods.map((f) => (
                  <div className="result-row" key={f.id}>
                    <button
                      className="saved-food"
                      onClick={() => setSelected(f)}
                    >
                      <strong>{f.name}</strong>
                      <small>
                        {fmt(f.calories)} kcal · {fmt(f.protein)} g protein
                      </small>
                    </button>
                    <button
                      className="icon-btn"
                      aria-label={`Remove saved ${f.name}`}
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          savedFoods: s.savedFoods.filter((x) => x.id !== f.id),
                        }))
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <Empty
                  icon={<Bookmark size={25} />}
                  headline="Keep the meals you love."
                  text="Use the bookmark beside a logged food to save it here for next time."
                />
              )}
            </>
          )}
          {mode === "Photo / describe" && <PhotoMeal onSave={log} />}
        </>
      )}
      {scanner && (
        <BarcodeScanner
          onClose={() => setScanner(false)}
          onResult={(code) => {
            setBarcode(code);
            setScanner(false);
            search(code);
          }}
        />
      )}
    </Modal>
  );
}
function FoodEditor({
  food,
  onSave,
}: {
  food?: Food;
  onSave: (f: Food) => void;
}) {
  const [unit, setUnit] = useState<"g" | "ml">(food?.unit || "g");
  const [name, setName] = useState(food?.name || ""),
    [grams, setGrams] = useState(String(food?.grams || 100)),
    [values, setValues] = useState<Nutrients>({
      calories: food?.calories || 0,
      protein: food?.protein || 0,
      carbs: food?.carbs || 0,
      fat: food?.fat || 0,
    });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          id: food?.id || uid(),
          name,
          grams: Number(grams),
          unit,
          ...values,
          source: food?.source || "Manual entry",
          sourceUrl: food?.sourceUrl,
          basis: "confirmed portion",
        });
      }}
    >
      <Field label="Food or meal name">
        <input
          required
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Chicken, rice and vegetables"
        />
      </Field>
      <Field
        label="Portion unit"
        hint="Use the same unit as the source label. Switching units does not convert density."
      >
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as "g" | "ml")}
        >
          <option value="g">Grams (g)</option>
          <option value="ml">Millilitres (ml)</option>
        </select>
      </Field>
      <Field
        label={`Portion (${unit})`}
        hint="Check cooked versus raw weight and the serving unit on your package."
      >
        <input
          type="number"
          required
          min="1"
          max="5000"
          step="0.1"
          value={grams}
          onChange={(e) => {
            setGrams(e.target.value);
            if (food && Number(e.target.value) > 0) {
              const f = scaleFood(food, Number(e.target.value));
              setValues({
                calories: f.calories,
                protein: f.protein,
                carbs: f.carbs,
                fat: f.fat,
              });
            }
          }}
        />
      </Field>
      <div className="form-grid">
        {(["calories", "protein", "carbs", "fat"] as const).map((k) => (
          <Field
            key={k}
            label={`${k[0].toUpperCase() + k.slice(1)} (${k === "calories" ? "kcal" : "g"})`}
          >
            <input
              type="number"
              required
              min="0"
              max={k === "calories" ? 10000 : 2000}
              step="0.1"
              value={values[k]}
              onChange={(e) =>
                setValues((v) => ({ ...v, [k]: Number(e.target.value) }))
              }
            />
          </Field>
        ))}
      </div>
      <p className="muted small">
        Enter totals for the portion you will eat. These numbers stay editable
        before saving.
      </p>
      {food?.sourceUrl && (
        <a
          className="small"
          href={food.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          View original food record
        </a>
      )}
      <button className="primary full" type="submit">
        <Check size={17} />
        Confirm and log food
      </button>
    </form>
  );
}
function FoodLibrary({
  state,
  onSelect,
}: {
  state: StoreProps["state"];
  onSelect: (food: Food) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<
    "Smart" | "Favourites" | "Recent" | "All"
  >("Smart");
  const recentNames = new Set(
    [...state.foods]
      .reverse()
      .slice(0, 20)
      .map((item) => item.name.toLowerCase()),
  );
  const counts = new Map<string, number>();
  state.foods.forEach((item) =>
    counts.set(
      item.name.toLowerCase(),
      (counts.get(item.name.toLowerCase()) || 0) + 1,
    ),
  );
  const savedIds = new Set(state.savedFoods.map((item) => item.id));
  const combined = [...state.savedFoods, ...commonFoods].filter(
    (item, index, all) =>
      all.findIndex((candidate) => candidate.id === item.id) === index,
  );
  const visible = combined
    .filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase().trim()),
    )
    .filter((item) =>
      filter === "Favourites"
        ? savedIds.has(item.id)
        : filter === "Recent"
          ? recentNames.has(item.name.toLowerCase())
          : true,
    )
    .toSorted((a, b) =>
      filter === "Smart"
        ? (counts.get(b.name.toLowerCase()) || 0) -
          (counts.get(a.name.toLowerCase()) || 0)
        : a.name.localeCompare(b.name),
    );
  return (
    <div className="food-library">
      <div className="search-input food-library-search">
        <Search size={18} />
        <input
          aria-label="Filter food library"
          placeholder="Search everyday foods"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="food-filter-row" aria-label="Food library filters">
        {(["Smart", "Favourites", "Recent", "All"] as const).map(
          (item) => (
            <button
              key={item}
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ),
        )}
      </div>
      <div className="library-heading">
        <strong>{filter === "Smart" ? "Everyday foods" : filter}</strong>
        <span>{visible.length} items</span>
      </div>
      <div className="food-library-list">
        {visible.map((food) => (
          <button
            key={food.id}
            className="result-row"
            onClick={() => onSelect(food)}
          >
            <span className="food-icon food-emoji" aria-hidden="true">
              {foodIcon(food.name)}
            </span>
            <span>
              <strong>{food.name}</strong>
              <small>
                {food.brand || "Generic"} · {fmt(food.grams)} {food.unit || "g"}
              </small>
            </span>
            <span>
              {fmt(food.calories)}
              <small>kcal · {fmt(food.protein)}g P</small>
            </span>
            <Plus size={17} />
          </button>
        ))}
      </div>
      {!visible.length && (
        <Empty
          icon={<Search size={25} />}
          headline="No matching foods yet."
          text="Try All, search the online databases, or create a manual item."
        />
      )}
      <p className="notice small">
        Library values are approximate. Confirm brands, cooking method, oil and
        portion size before logging.
      </p>
    </div>
  );
}

function PhotoMeal({ onSave }: { onSave: (foods: Food[]) => void }) {
  const [image, setImage] = useState(""),
    [description, setDescription] = useState(""),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [estimate, setEstimate] = useState<any>(null);
  async function analyze() {
    setBusy(true);
    setError("");
    setEstimate(null);
    try {
      const result = await api("/api/ai", {
        method: "POST",
        body: JSON.stringify({
          mode: "meal",
          text: description,
          image: image || undefined,
          consent,
        }),
      });
      setEstimate(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      {image ? (
        <div className="photo-preview">
          <img src={image} alt="Your meal, ready to estimate" />
          <button
            className="icon-btn"
            aria-label="Remove meal photo"
            onClick={() => {
              setImage("");
              setEstimate(null);
            }}
          >
            <X size={20} />
          </button>
        </div>
      ) : (
        <label className="upload-area">
          <Camera size={32} strokeWidth={1.5} />
          <strong>Add a photo of your plate</strong>
          <span>JPEG, PNG or WebP · optional if you describe it</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={async (e) => {
              if (e.target.files?.[0])
                try {
                  setImage(await compressImage(e.target.files[0]));
                  setEstimate(null);
                } catch (error) {
                  setError((error as Error).message);
                }
            }}
          />
        </label>
      )}
      <Field
        label="What’s on the plate?"
        hint="Include portions, cooking oil, sauces and brand details where you know them."
      >
        <textarea
          rows={3}
          maxLength={3000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Chicken breast, cooked rice, vegetables, and 1 tsp olive oil…"
        />
      </Field>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        Send this meal photo / description to Google Gemini for an estimate. The
        app does not store the photo.
      </label>
      <button
        className="primary full"
        disabled={busy || !consent || (!image && !description.trim())}
        onClick={analyze}
      >
        <Camera size={17} />
        {busy ? "Estimating your meal…" : "Estimate this meal"}
      </button>
      <ErrorNote message={error} />
      {estimate && (
        <div className="estimate">
          <h3>Review your estimate</h3>
          <p className="notice">
            Plausible total: {fmt(estimate.lowCalories)}–
            {fmt(estimate.highCalories)} kcal. This is an estimate, not a
            measurement.
          </p>
          {estimate.assumptions.map((s: string, i: number) => (
            <p className="muted small" key={i}>
              • {s}
            </p>
          ))}
          {estimate.questions.map((s: string, i: number) => (
            <p className="small" key={i}>
              {s}
            </p>
          ))}
          {estimate.items.map((item: any, i: number) => (
            <div className="estimate-item" key={i}>
              <div className="row between">
                <input
                  aria-label={`Food ${i + 1} name`}
                  value={item.name}
                  onChange={(e) =>
                    setEstimate({
                      ...estimate,
                      items: estimate.items.map((x: any, n: number) =>
                        n === i ? { ...x, name: e.target.value } : x,
                      ),
                    })
                  }
                />
                <button
                  className="icon-btn"
                  aria-label={`Remove ${item.name}`}
                  onClick={() =>
                    setEstimate({
                      ...estimate,
                      items: estimate.items.filter(
                        (_: any, n: number) => n !== i,
                      ),
                    })
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="estimate-grid">
                {["grams", "calories", "protein", "carbs", "fat"].map((k) => (
                  <Field key={k} label={k === "calories" ? "kcal" : k}>
                    <input
                      aria-label={`${item.name} ${k}`}
                      type="number"
                      min={k === "grams" ? 1 : 0}
                      max="10000"
                      step="0.1"
                      value={item[k]}
                      onChange={(e) =>
                        setEstimate({
                          ...estimate,
                          items: estimate.items.map((x: any, n: number) =>
                            n === i ? { ...x, [k]: Number(e.target.value) } : x,
                          ),
                        })
                      }
                    />
                  </Field>
                ))}
              </div>
            </div>
          ))}
          <p className="muted small">
            Changing grams alone does not recalculate AI nutrients. Adjust each
            total, or describe the corrected portions and estimate again.
          </p>
          <button
            className="primary full"
            disabled={
              !estimate.items.length ||
              estimate.items.some(
                (x: any) =>
                  !x.name.trim() ||
                  x.grams <= 0 ||
                  ["grams", "calories", "protein", "carbs", "fat"].some(
                    (k) => !Number.isFinite(x[k]) || x[k] < 0 || x[k] > 10000,
                  ),
              )
            }
            onClick={() =>
              onSave(
                estimate.items.map((x: any) => ({
                  ...x,
                  id: uid(),
                  source: "AI estimate · confirmed by you",
                  basis: "confirmed portion",
                })),
              )
            }
          >
            <Check size={17} />
            Confirm {fmt(totalFoods(estimate.items).calories)} kcal and log
          </button>
        </div>
      )}
    </div>
  );
}
function BarcodeScanner({
  onClose,
  onResult,
}: {
  onClose: () => void;
  onResult: (code: string) => void;
}) {
  const video = useRef<HTMLVideoElement>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let stopped = false;
    let controls: { stop: () => void } | undefined;
    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const c = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          video.current!,
          (result) => {
            if (result && !stopped) {
              stopped = true;
              onResult(result.getText());
              controls?.stop();
            }
          },
        );
        controls = c;
        if (stopped) c.stop();
      } catch {
        setError(
          "Camera access is unavailable. Close this window and enter the barcode digits.",
        );
      }
    })();
    return () => {
      stopped = true;
      controls?.stop();
    };
  }, []);
  return (
    <Modal title="Scan a food barcode" onClose={onClose}>
      <video ref={video} className="scanner" muted playsInline />
      <p className="muted">Hold the barcode steady inside the camera view.</p>
      <ErrorNote message={error} />
    </Modal>
  );
}
