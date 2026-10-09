import assert from "node:assert/strict";
import test from "node:test";
import { commonFoods } from "../data/common-foods";
import { foodIcon } from "../lib/food-icons";
import { recipes } from "../data/recipes";

test("offline food library contains the reference foods with valid portions", () => {
  const names = new Set(commonFoods.map((food) => food.name.toLowerCase()));
  for (const name of [
    "egg",
    "banana",
    "chicken breast, cooked",
    "beef steak, cooked",
    "avocado",
    "whey protein",
    "garden salad",
    "olive oil",
  ]) {
    assert.ok(names.has(name), `${name} is missing`);
  }
  assert.equal(new Set(commonFoods.map((food) => food.id)).size, commonFoods.length);
  assert.ok(
    commonFoods.every(
      (food) =>
        food.grams > 0 &&
        food.calories >= 0 &&
        food.protein >= 0 &&
        food.carbs >= 0 &&
        food.fat >= 0,
    ),
  );
});

test("recognizable food icons replace the generic plate when possible", () => {
  assert.equal(foodIcon("Large boiled egg"), "🥚");
  assert.equal(foodIcon("Fresh banana"), "🍌");
  assert.equal(foodIcon("Grilled salmon"), "🐟");
  assert.equal(foodIcon("Unknown prepared dish"), "🍽️");
});

test("Afghan and international staples are available offline", () => {
  const names = commonFoods.map((food) => food.name.toLowerCase());
  for (const term of ["kabuli pulao", "afghan rosh", "mantu", "ashak", "bolani", "shawarma"]) {
    assert.ok(names.some((name) => name.includes(term)), `${term} is missing`);
  }
});

test("recipes cover breakfast, lunch and dinner with editable servings", () => {
  assert.deepEqual(new Set(recipes.map((recipe) => recipe.meal)), new Set(["Breakfast", "Lunch", "Dinner"]));
  assert.ok(recipes.every((recipe) => recipe.food.unit === "serving"));
  assert.ok(recipes.every((recipe) => recipe.ingredients.length >= 3 && recipe.steps.length >= 2));
});
