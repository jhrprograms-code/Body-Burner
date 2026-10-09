import type { Food, MealName } from "@/lib/domain";

export type Recipe = {
  id: string;
  name: string;
  meal: MealName;
  minutes: number;
  food: Food;
  ingredients: string[];
  steps: string[];
};

const recipe = (
  id: string,
  name: string,
  meal: MealName,
  minutes: number,
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
  ingredients: string[],
  steps: string[],
): Recipe => ({
  id,
  name,
  meal,
  minutes,
  food: {
    id: `recipe-${id}`,
    name,
    brand: "Body Burner recipe",
    source: "Body Burner recipe estimate",
    basis: "per serving · approximate",
    grams: 1,
    unit: "serving",
    calories,
    protein,
    carbs,
    fat,
  },
  ingredients,
  steps,
});

export const recipes: Recipe[] = [
  recipe("eggs-oats", "Egg and oatmeal breakfast", "Breakfast", 12, 430, 28, 45, 16,
    ["2 eggs", "50 g oats", "150 ml 2% milk", "100 g berries", "Cinnamon"],
    ["Cook oats with milk.", "Cook eggs with minimal oil.", "Serve with berries and cinnamon."]),
  recipe("yogurt-bowl", "Greek yogurt protein bowl", "Breakfast", 5, 390, 35, 44, 9,
    ["250 g plain Greek yogurt", "100 g berries", "30 g oats", "15 g almonds", "Optional cinnamon"],
    ["Add yogurt to a bowl.", "Top with oats, berries and almonds."]),
  recipe("protein-smoothie", "Banana berry protein smoothie", "Breakfast", 5, 455, 39, 57, 9,
    ["1 banana", "150 g frozen berries", "250 ml 2% milk", "30 g whey protein", "Ice"],
    ["Blend everything until smooth.", "Add water or ice to adjust thickness."]),
  recipe("afghan-omelette", "Afghan-style vegetable omelette", "Breakfast", 15, 360, 24, 14, 23,
    ["3 eggs", "80 g tomato", "40 g onion", "15 g cilantro", "1 tsp olive oil", "Cumin and pepper"],
    ["Dice the vegetables.", "Soften onion and tomato in oil.", "Add beaten eggs and cilantro; cook until set."]),
  recipe("chicken-rice", "Chicken, rice and broccoli bowl", "Lunch", 30, 610, 55, 68, 13,
    ["170 g cooked chicken breast", "180 g cooked rice", "150 g broccoli", "1 tsp olive oil", "Garlic and spices"],
    ["Season and cook chicken thoroughly.", "Steam broccoli.", "Serve over rice and add measured oil."]),
  recipe("shawarma-bowl", "Chicken shawarma bowl", "Lunch", 35, 590, 48, 61, 17,
    ["170 g chicken breast", "150 g cooked rice", "Tomato and cucumber", "60 g yogurt", "1 tsp olive oil", "Cumin, paprika and garlic"],
    ["Coat chicken with yogurt and spices.", "Cook chicken thoroughly and slice.", "Assemble with rice and vegetables."]),
  recipe("tuna-wrap", "Tuna salad wrap", "Lunch", 10, 465, 42, 45, 13,
    ["120 g tuna in water", "1 whole-wheat flatbread", "Lettuce and tomato", "40 g Greek yogurt", "Lemon and pepper"],
    ["Mix tuna, yogurt, lemon and pepper.", "Add vegetables and tuna to flatbread; wrap."]),
  recipe("lentil-soup", "Lentil vegetable soup", "Lunch", 40, 430, 25, 67, 8,
    ["180 g cooked lentils", "Carrot, onion and tomato", "750 ml low-sodium broth", "1 tsp olive oil", "Cumin and turmeric"],
    ["Soften chopped vegetables in oil.", "Add lentils, broth and spices.", "Simmer 25 minutes."]),
  recipe("light-kabuli", "Lighter Afghan Kabuli pulao", "Dinner", 60, 690, 45, 89, 18,
    ["170 g lean beef or chicken", "180 g cooked basmati rice", "80 g carrot", "15 g raisins", "10 g pistachios", "1 tsp oil", "Cumin and cardamom"],
    ["Cook meat until tender.", "Sauté carrot and raisins in measured oil.", "Layer with rice and spices; steam gently."]),
  recipe("afghan-rosh", "Afghan rosh with vegetables", "Dinner", 75, 560, 48, 29, 28,
    ["200 g lean lamb or beef", "150 g potato", "Tomato, onion and garlic", "Water or broth", "Salt, pepper and cilantro"],
    ["Brown meat lightly without excess oil.", "Add vegetables and broth.", "Cover and simmer until meat is tender."]),
  recipe("salmon-potato", "Salmon, potato and greens", "Dinner", 35, 585, 43, 48, 24,
    ["170 g salmon", "250 g potato", "150 g green vegetables", "1 tsp olive oil", "Lemon and pepper"],
    ["Roast potato with half the oil.", "Bake salmon until cooked through.", "Steam greens and finish with lemon."]),
  recipe("kofta-bowl", "Afghan kofta rice bowl", "Dinner", 40, 640, 43, 65, 23,
    ["170 g lean ground beef", "160 g cooked basmati rice", "Tomato, onion and garlic", "60 g yogurt", "Cumin and coriander"],
    ["Mix meat with onion and spices; shape into kofta.", "Cook thoroughly in tomato sauce.", "Serve with rice and yogurt."]),
];
