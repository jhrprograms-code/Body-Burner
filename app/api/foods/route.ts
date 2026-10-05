import { authorized, consume, failure, ApiError } from "@/lib/server";
import { offFood, usdaFood } from "@/lib/food";
export async function GET(request: Request) {
  try {
    const { client } = await authorized(request);
    const params = new URL(request.url).searchParams;
    const q = (params.get("q") || "").trim(),
      barcode = params.get("barcode"),
      provider = params.get("provider") || "off";
    if (barcode ? !/^\d{8,14}$/.test(barcode) : q.length < 2 || q.length > 100)
      throw new ApiError("Enter a food name or an 8–14 digit barcode.");
    await consume(client, "food");
    let url: string;
    if (provider === "usda" && !barcode) {
      if (!process.env.USDA_API_KEY)
        throw new ApiError(
          "USDA search is not configured. Use packaged-food search or enter the nutrition label manually.",
          503,
        );
      url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&pageSize=25&api_key=${encodeURIComponent(process.env.USDA_API_KEY)}`;
    } else {
      if (!process.env.FOOD_API_CONTACT)
        throw new ApiError(
          "Food search needs the app owner to configure a contact email. Manual logging is available.",
          503,
        );
      const fields =
        "code,product_name,brands,nutriments,product_quantity_unit";
      url = barcode
        ? `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=${fields}`
        : `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=25&fields=${fields}`;
    }
    const result = await fetch(url, {
      headers: {
        "User-Agent": `BodyBurner/0.1 (${process.env.FOOD_API_CONTACT || "personal fitness app"})`,
      },
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
    if (!result.ok)
      throw new ApiError(
        "The food database is busy. Please try again or use a nutrition label.",
        502,
      );
    const data = await result.json();
    const raw =
      provider === "usda" && !barcode
        ? data.foods || []
        : barcode
          ? data.product
            ? [{ ...data.product, code: barcode }]
            : []
          : data.products || [];
    const foods = raw
      .map(provider === "usda" && !barcode ? usdaFood : offFood)
      .filter(Boolean);
    return Response.json(
      {
        foods,
        note:
          raw.length > foods.length
            ? "Some results had incomplete nutrition data and were omitted."
            : foods.length
              ? "Confirm the product, cooked/raw state and serving on your package."
              : "No complete match found. Try another term or log the label manually.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
