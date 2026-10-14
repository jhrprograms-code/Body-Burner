import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Training from "../components/Training";
import Nutrition, { FoodEditor } from "../components/Nutrition";
import Progress from "../components/Progress";
import Coach from "../components/Coach";
import Settings from "../components/Settings";
import Social from "../components/Social";
import { Meter, Modal } from "../components/ui";
import { emptyState, dayKey, type Food } from "../lib/domain";

const state = emptyState();
const props = { state, setState: () => {}, notify: () => {} };
test("all principal workspace screens render without errors for an empty journal", () => {
  for (const element of [
    createElement(Training, props),
    createElement(Nutrition, { ...props, date: dayKey(), setDate: () => {} }),
    createElement(Progress, { ...props, user: null }),
    createElement(Coach, props),
    createElement(Settings, { ...props, user: null, onLogin: () => {} }),
    createElement(Social, { ...props, user: null, onLogin: () => {} }),
  ])
    assert.match(renderToStaticMarkup(element), /<h1/);
});
test("active training shows history and a load option from completed sets", () => {
  const withTraining = emptyState();
  const exercise = {
    exerciseId: "E002", pain: false,
    sets: [1, 2, 3].map((n) => ({
      id: String(n), weight: "20", reps: "12", rir: "2", done: true,
    })),
  };
  withTraining.sessions = [{
    id: "history", date: "2026-10-01", name: "Push A", startedAt: 1,
    finishedAt: 2, exercises: [exercise],
  }];
  withTraining.active = {
    id: "active", date: dayKey(), name: "Push A", startedAt: Date.now(),
    exercises: [{ ...exercise, sets: exercise.sets.map((set) => ({
      ...set, reps: "", rir: "", done: false,
    })) }],
  };
  const html = renderToStaticMarkup(
    createElement(Training, { ...props, state: withTraining }),
  );
  assert.match(html, /View 1 previous workout/);
  assert.match(html, /Use 22 lb/);
  assert.match(html, /20 × 12/);
});
test("signed-out community screen explains privacy and offers sign in", () => {
  const html = renderToStaticMarkup(
    createElement(Social, { ...props, user: null, onLogin: () => {} }),
  );
  assert.match(html, /Your social space stays private/);
  assert.match(html, /never posted automatically/);
  assert.match(html, /Sign in to continue/);
});
test("food confirmation retains known micronutrients and supports fractional servings", () => {
  const food: Food = {
    id: "test",
    name: "Test oats",
    grams: 1,
    unit: "serving",
    calories: 150,
    protein: 5,
    carbs: 27,
    fat: 3,
    fiber: 4,
    sugar: 1,
    sodium: 7,
    source: "Test",
    basis: "portion",
  };
  const html = renderToStaticMarkup(
    createElement(FoodEditor, { food, onSave: () => {} }),
  );
  assert.match(html, /min="0.1"/);
  assert.match(html, /Fiber \(g\)/);
  assert.match(html, /Total sugar \(g\)/);
  assert.match(html, /Sodium \(mg\)/);
  for (const value of [4, 1, 7])
    assert.match(html, new RegExp(`value="${value}"`));
});
test("dialogs have an accessible name", () => {
  const html = renderToStaticMarkup(
    createElement(Modal, {
      title: "Test dialog",
      onClose: () => {},
      children: "Test content",
    }),
  );
  assert.match(html, /aria-labelledby="([^"]+)"/);
  const id = html.match(/aria-labelledby="([^"]+)"/)![1];
  assert.ok(html.includes(`<h2 id="${id}">Test dialog</h2>`));
});
test("nutrition meters expose their value to assistive technology", () => {
  const html = renderToStaticMarkup(
    createElement(Meter, {
      label: "Protein",
      value: 80,
      max: 160,
    }),
  );
  assert.match(html, /role="progressbar"/);
  assert.match(html, /aria-label="Protein"/);
  assert.match(html, /aria-valuenow="80"/);
  assert.match(html, /aria-valuemax="160"/);
});
test("settings correctly describe workout pounds and movable recovery days", () => {
  const html = renderToStaticMarkup(
    createElement(Settings, { ...props, user: null, onLogin: () => {} }),
  );
  assert.match(html, /Workout lb/);
  assert.match(html, /Move days in Training/);
  assert.doesNotMatch(html, /Sunday is the recovery day/);
});
test("future measurements never appear as the latest weight or waist", () => {
  const s = emptyState();
  s.measurements = [
    {
      id: "future",
      date: "2100-01-01",
      weight: 123.4,
      waist: 222.2,
      notes: "",
    },
  ];
  const html = renderToStaticMarkup(
    createElement(Progress, { ...props, state: s, user: null }),
  );
  assert.doesNotMatch(html, /123\.4|222\.2/);
});
