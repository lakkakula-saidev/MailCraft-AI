// =====================================
// helper.gs — shared utilities for MailCraft AI
// Final Stable Version (Option B + Enhanced UI)
// =====================================

// ------------------------------------
// SETUP STATE MANAGEMENT
// ------------------------------------
function needsSetup_() {
  const props = PropertiesService.getUserProperties();
  const completed = props.getProperty("setup_completed") === "true";

  // If setup was completed → NEVER show setup again
  // unless key invalidation explicitly resets it
  return !completed;
}

function getUserSettings_() {
  const props = PropertiesService.getUserProperties();
  return {
    provider: props.getProperty("llm_provider") || "",
    apiKey: props.getProperty("llm_api_key") || ""
  };
}

// Explicit invalidation when API returns an invalid-key response
function invalidateKey_(errorMessage) {
  const props = PropertiesService.getUserProperties();
  props.deleteProperty("llm_api_key");
  props.setProperty("setup_completed", "false");
  props.setProperty("invalid_key_reason", errorMessage || "API key invalid.");
}

// ------------------------------------
// THREAD CONTEXT BUILDER
// ------------------------------------
function getThreadContext_(thread) {
  const messages = thread.getMessages();
  const context = [];

  messages.forEach((msg, index) => {
    const sender = msg.getFrom();
    const date = msg.getDate();
    const body = stripHtml_(msg.getPlainBody() || msg.getBody());
    context.push(
      `--- Message #${index + 1} ---\nFrom: ${sender}\nDate: ${date}\n\n${body}`
    );
  });

  return context.join("\n\n");
}

// ------------------------------------
// LLM CALLERS
// ------------------------------------
function callLLM_(provider, apiKey, prompt) {
  if (!provider || !apiKey) return "❌ INVALID_KEY";

  try {
    if (provider === "openai") return callOpenAI_(apiKey, prompt);
    if (provider === "gemini") return callGemini_(apiKey, prompt);
    return "❌ Unsupported provider.";
  } catch (err) {
    return "❌ " + err.message;
  }
}

// ----- OpenAI -----
function callOpenAI_(apiKey, prompt) {
  const url = "https://api.openai.com/v1/chat/completions";

  const payload = {
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6
  };

  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const code = res.getResponseCode();
  const text = res.getContentText();

  // Invalid Key?
  if (
    code === 401 ||
    text.includes("invalid") ||
    text.includes("Incorrect API key")
  ) {
    invalidateKey_(text);
    return "❌ INVALID_KEY";
  }

  if (code !== 200) return "❌ OpenAI Error: " + text;

  const data = JSON.parse(text);
  return (
    data?.choices?.[0]?.message?.content?.trim() ||
    "❌ Empty response from OpenAI."
  );
}

// ----- Gemini -----
function callGemini_(apiKey, prompt) {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" +
    encodeURIComponent(apiKey);

  const payload = { contents: [{ parts: [{ text: prompt }] }] };

  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const code = res.getResponseCode();
  const text = res.getContentText();

  if (code === 401 || text.includes("API key not valid")) {
    invalidateKey_(text);
    return "❌ INVALID_KEY";
  }

  if (code !== 200) return "❌ Gemini Error: " + text;

  const data = JSON.parse(text);

  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
    "❌ Empty response from Gemini."
  );
}

// ------------------------------------
// LIGHTWEIGHT KEY TEST
// ------------------------------------
function testLLMKey_(provider, apiKey) {
  const result = callLLM_(provider, apiKey, "Reply with: OK");
  return result && result.includes("OK");
}

// ------------------------------------
// UTIL
// ------------------------------------
function stripHtml_(html) {
  return html
    ? html
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim()
    : "";
}
