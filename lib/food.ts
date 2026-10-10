import type { Food } from "./domain";
const number = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
export function offFood(p: Record<string, any>): Food | null {
  const n = p.nutriments || {};
  const calories =
    number(n["energy-kcal_100g"]) ??
    (number(n.energy_100g) !== null && n.energy_unit === "kJ"
      ? Number(n.energy_100g) / 4.184
      : null);
  const protein = number(n.proteins_100g),
    carbs = number(n.carbohydrates_100g),
    fat = number(n.fat_100g);
  if (
    !p.product_name ||
    [calories, protein, carbs, fat].some((n) => n === null)
  )
    return null;
  return {
    id: `off-${p.code}`,
    name: p.product_name,
    brand: p.brands || "",
    source: "Open Food Facts · ODbL",
    sourceUrl: `https://world.openfoodfacts.org/product/${encodeURIComponent(p.code)}`,
    basis: `per 100 ${["ml", "l", "cl"].includes(p.product_quantity_unit) ? "ml" : "g"} — check package`,
    grams: 100,
    unit: ["ml", "l", "cl"].includes(p.product_quantity_unit) ? "ml" : "g",
    calories: calories!,
    protein: protein!,
    carbs: carbs!,
    fat: fat!,
    ...(number(n.fiber_100g) !== null ? { fiber: number(n.fiber_100g)! } : {}),
    ...(number(n.sugars_100g) !== null
      ? { sugar: number(n.sugars_100g)! }
      : {}),
    ...(number(n.sodium_100g) !== null
      ? { sodium: number(n.sodium_100g)! * 1000 }
      : {}),
  };
}
export function usdaFood(p: Record<string, any>): Food | null {
  const nutrients = p.foodNutrients || [];
  const n = (ids: number[], unit?: string) => {
    const x = nutrients.find(
      (n: any) =>
        ids.includes(n.nutrientId) &&
        (!unit || n.unitName?.toUpperCase() === unit),
    );
    return number(x?.value);
  };
  const calories = n([1008, 2047, 2048], "KCAL"),
    protein = n([1003]),
    carbs = n([1005]),
    fat = n([1004]);
  if (!p.description || [calories, protein, carbs, fat].some((n) => n === null))
    return null;
  return {
    id: `usda-${p.fdcId}`,
    name: p.description,
    brand: p.brandOwner || "",
    source: "USDA FoodData Central · CC0",
    sourceUrl: `https://fdc.nal.usda.gov/food-details/${p.fdcId}/nutrients`,
    basis: "per 100 g",
    grams: 100,
    calories: calories!,
    protein: protein!,
    carbs: carbs!,
    fat: fat!,
    ...(n([1079], "G") !== null ? { fiber: n([1079], "G")! } : {}),
    ...(n([2000], "G") !== null ? { sugar: n([2000], "G")! } : {}),
    ...(n([1093], "MG") !== null ? { sodium: n([1093], "MG")! } : {}),
  };
}
