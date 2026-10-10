// Model identifiers are configuration, never credentials. Do not echo invalid values.
export function geminiModel(raw?: string) {
  const model = (raw || "gemini-3.1-flash-lite")
    .trim()
    .replace(/^models\//, "");
  if (!/^gemini-[a-z0-9.-]+$/.test(model))
    throw new Error(
      "Set GEMINI_MODEL to a model ID such as gemini-3.1-flash-lite. Put your Google API key in GEMINI_API_KEY, not GEMINI_MODEL.",
    );
  return model;
}
export function providerError(status: number) {
  if (status === 400)
    return "Google rejected the AI request. Check the API key and model settings. No estimate was saved.";
  if (status === 401 || status === 403)
    return "Google denied API access. Check that your Gemini API key belongs to the billed project and permits the Generative Language API.";
  if (status === 404)
    return "This Gemini model is not available to your Google project. Check GEMINI_MODEL in Vercel; older models may have restricted access.";
  if (status === 429)
    return "Google’s request or quota limit was reached. Billing does not remove every limit. Wait a moment and try again.";
  return "Google is temporarily unavailable. Please try again. No estimate was saved.";
}
