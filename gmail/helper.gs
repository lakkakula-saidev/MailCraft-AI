// =====================================
// helper.gs — shared utilities (FINAL, STABLE 2025)
// =====================================

// -------------------------------
// Setup / Settings Helpers
// -------------------------------
function needsSetup_() {
  const props = PropertiesService.getUserProperties();
  const provider = props.getProperty("llm_provider");
  const apiKey = props.getProperty("llm_api_key");
  const completed = props.getProperty("setup_completed");
  return !provider || !apiKey || completed !== "true";
}

function getUserSettings_() {
  const props = PropertiesService.getUserProperties();
  return {
    provider: props.getProperty("llm_provider") || "",
    apiKey: props.getProperty("llm_api_key") || ""
  };
}

function invalidateKey_(msg) {
  const props = PropertiesService.getUserProperties();
  props.deleteProperty("llm_api_key");
  props.setProperty("setup_completed", "false");
  props.setProperty("invalid_key_reason", msg || "Unknown error");
  props.setProperty("llm_invalid_reason", msg || "Unknown error");
}

// =======================================================
// Custom Reply Rules storage (PERSISTENT user settings)
// =======================================================
function saveReplyRules_(rules) {
  const props = PropertiesService.getUserProperties();
  props.setProperty("reply_rules", rules || "");
}

function loadReplyRules_() {
  const props = PropertiesService.getUserProperties();
  return props.getProperty("reply_rules") || "";
}

// -------------------------------
// Minimal smart language detector
// -------------------------------
function detectLanguageMinimal_(text) {
  if (!text) return "english";
  text = text.toLowerCase();

  if (/[äöüß]/.test(text)) return "german";
  if (/[àâçéèêëîïôûùüÿæœ]/.test(text)) return "french";
  if (/[áéíñóúü¿¡]/.test(text)) return "spanish";
  if (/[àèéìíîòóù]/.test(text)) return "italian";

  return "english";
}

// -------------------------------
// Tone Helper
// -------------------------------
function getToneInstruction_(tone) {
  switch (tone) {
    case "formal":
      return "Use a formal, professional, respectful, and structured tone.";
    case "neutral":
      return "Use a balanced, clear, and straightforward tone.";
    case "friendly":
      return "Use a warm, polite, and approachable tone.";
    case "concise":
      return "Use a very short, clear, and concise tone without filler.";
    case "assertive":
      return "Use a confident, direct, and respectful tone.";
    case "enthusiastic":
      return "Use an energetic, positive, and uplifting tone.";
    case "apologetic":
      return "Use a soft, polite, regretful, and humble tone.";
    default:
      return "Use a neutral and balanced tone.";
  }
}

// -------------------------------
// Build full thread context
// -------------------------------
function getThreadContext_(thread) {
  const messages = thread.getMessages();
  const out = [];

  messages.forEach((msg, i) => {
    const sender = msg.getFrom();
    const date = msg.getDate();
    const clean = stripHtml_(msg.getPlainBody() || msg.getBody());
    out.push(
      "--- Message #" +
        (i + 1) +
        " ---\n" +
        "From: " +
        sender +
        "\n" +
        "Date: " +
        date +
        "\n\n" +
        clean
    );
  });

  return out.join("\n\n");
}

// -------------------------------
// LLM sanitization
// -------------------------------
function sanitizeLLMEmail_(text) {
  if (!text) return "";

  text = text.replace(/\[.*?Name.*?\]/gi, "");
  text = text.replace(/\[.*?Recipient.*?\]/gi, "");
  text = text.replace(/<.*?Name.*?>/gi, "");
  text = text.replace(/\(.*?Name.*?\)/gi, "");

  text = text.replace(/dear recipient[,:\s]*/gi, "");
  text = text.replace(/dear customer[,:\s]*/gi, "");
  text = text.replace(/From:\s*You/gi, "");

  text = text.replace(/[ ]{3,}/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

// =====================================
// FINAL EMAIL NORMALIZER (STABLE, ONE-PASS)
// =====================================
function normalizeEmailFormatting_(text) {
  if (!text) return "";

  text = text.replace(/\\n/g, "\n");

  text = text.trim();
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  text = text.replace(/[ ]{2,}/g, " ");

  const greetings = [
    /(Sehr geehrte[^\n]*?,)/i,
    /(Sehr geehrter[^\n]*?,)/i,
    /(Liebe[^\n]*?,)/i,
    /(Lieber[^\n]*?,)/i,
    /(Hallo[^\n]*?,)/i,
    /(Hi[^\n]*?,)/i,
    /(Dear[^\n]*?,)/i
  ];

  greetings.forEach(function (rx) {
    text = text.replace(rx, function (m) {
      return m + "\n\n";
    });
  });

  text = text.replace(/,\n([^\n])/g, ",\n\n$1");

  const signoffs = [
    "Mit freundlichen Grüßen",
    "Freundliche Grüße",
    "Viele Grüße",
    "Beste Grüße",
    "Best regards",
    "Kind regards",
    "Sincerely",
    "Yours sincerely",
    "Yours faithfully",
    "Warm regards",
    "Cordialement",
    "Bien à vous",
    "Sincères salutations",
    "Saludos cordiales",
    "Atentamente",
    "Cordiali saluti",
    "Distinti saluti"
  ];

  const so = "(" + signoffs.join("|") + ")";
  const signoffBlock = new RegExp(so + "[^\\n]*([\\s\\S]*)$", "i");

  const match = text.match(signoffBlock);

  if (match) {
    const signoffPhrase = match[1].trim();
    const tail = match[2].trim();

    const nameMatch = tail.match(/[A-Za-zÀ-ÿ]{2,}/);
    const senderName = nameMatch ? nameMatch[0] : "";

    const finalBlock = signoffPhrase + ",\n" + senderName;

    text = text.replace(signoffBlock, finalBlock);
  }

  text = text.replace(/([.!?])\n([^\n])/g, "$1\n\n$2");
  text = text.replace(/,\n([^\n])/g, ", $1");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

// =====================================
// LLM CALLERS
// =====================================
function callLLM_(provider, apiKey, prompt) {
  try {
    if (provider === "openai") return callOpenAI_(apiKey, prompt);
    if (provider === "gemini") return callGemini_(apiKey, prompt);
    return "❌ Unknown provider.";
  } catch (err) {
    return "❌ LLM Error: " + err.message;
  }
}

function callOpenAI_(apiKey, prompt) {
  const res = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + apiKey },
    payload: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.65
    }),
    muteHttpExceptions: true
  });

  const status = res.getResponseCode();
  const text = res.getContentText();

  if (
    status === 401 ||
    text.indexOf("invalid") !== -1 ||
    text.indexOf("Incorrect") !== -1
  ) {
    invalidateKey_(text);
    return "❌ INVALID_KEY";
  }

  if (status !== 200) return "❌ OpenAI Error: " + text;

  const data = JSON.parse(text);
  const raw =
    (data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content &&
      data.choices[0].message.content.trim()) ||
    "";

  return normalizeEmailFormatting_(sanitizeLLMEmail_(raw));
}

function callGemini_(apiKey, prompt) {
  const res = UrlFetchApp.fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" +
      encodeURIComponent(apiKey),
    {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
      muteHttpExceptions: true
    }
  );

  const status = res.getResponseCode();
  const text = res.getContentText();

  if (status === 401 || text.indexOf("not valid") !== -1) {
    invalidateKey_(text);
    return "❌ INVALID_KEY";
  }

  if (status !== 200) return "❌ Gemini Error: " + text;

  const data = JSON.parse(text);
  const raw =
    (data &&
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text &&
      data.candidates[0].content.parts[0].text.trim()) ||
    "";

  return normalizeEmailFormatting_(sanitizeLLMEmail_(raw));
}

function testLLMKey_(provider, apiKey) {
  const reply = callLLM_(provider, apiKey, "Respond only with OK.");
  return (
    reply &&
    reply.indexOf("INVALID_KEY") === -1 &&
    reply.toUpperCase().indexOf("OK") !== -1
  );
}

// =====================================
// UTILS
// =====================================

function stripHtml_(html) {
  return html
    ? html
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim()
    : "";
}

function extractMessageIdFromQuoted_(text) {
  if (!text) return "";

  const patterns = [
    /In-Reply-To:\s*<([^>]+)>/i,
    /References:\s*<([^>]+)>/i,
    /Message-ID:\s*<([^>]+)>/i
  ];

  for (var i = 0; i < patterns.length; i++) {
    var rx = patterns[i];
    var m = text.match(rx);
    if (m && m[1]) return m[1].trim();
  }

  return "";
}

function convertEmailToHtml_(text) {
  if (!text) return "";

  var html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/\n{2,}/g, "<br><br>");
  html = html.replace(/\n/g, "<br>");

  return html;
}
