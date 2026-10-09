const ICONS: Array<[RegExp, string]> = [
  [/egg/i, "🥚"], [/banana/i, "🍌"], [/avocado/i, "🥑"],
  [/milk|whey|protein/i, "🥛"], [/oat|cereal|bran/i, "🥣"],
  [/sugar/i, "🧊"], [/pancake|waffle/i, "🥞"],
  [/chicken|turkey/i, "🍗"], [/beef|steak|lamb/i, "🥩"],
  [/yogurt/i, "🥛"], [/salad/i, "🥗"], [/potato/i, "🥔"],
  [/salmon|tuna|fish/i, "🐟"], [/fig/i, "🟣"], [/chia/i, "🫘"],
  [/lettuce|spinach/i, "🥬"], [/coffee/i, "☕"], [/butter/i, "🧈"],
  [/pepper/i, "🫑"], [/bread/i, "🍞"], [/onion/i, "🧅"],
  [/cheese/i, "🧀"], [/tomato/i, "🍅"], [/oil/i, "🫒"],
  [/rice|quinoa/i, "🍚"], [/broccoli/i, "🥦"], [/apple/i, "🍎"],
  [/strawberr/i, "🍓"], [/blueberr/i, "🫐"], [/almond|peanut|nut/i, "🥜"],
  [/lentil|chickpea|bean/i, "🫘"],
  [/kabuli|pulao|biryani/i, "🍛"], [/rosh|qorma|karahi|shorwa/i, "🍲"],
  [/mantu|ashak/i, "🥟"], [/bolani|naan|flatbread|wrap/i, "🫓"],
  [/shawarma|kebab|kofta/i, "🥙"], [/hummus|falafel/i, "🧆"],
  [/carrot/i, "🥕"], [/cucumber/i, "🥒"], [/eggplant/i, "🍆"],
  [/pumpkin/i, "🎃"], [/orange/i, "🍊"], [/pear/i, "🍐"],
  [/mango/i, "🥭"], [/grape|raisin/i, "🍇"], [/date/i, "🌴"],
];

export function foodIcon(name: string) {
  return ICONS.find(([pattern]) => pattern.test(name))?.[1] || "🍽️";
}
