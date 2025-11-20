/**
 * MailCraft AI — Gmail Add-on (FINAL 2025)
 * FULL UPDATED FILE (sanitized & production-safe)
 */

// =====================================
// ENTRY POINTS
// =====================================

function onHomepage() {
  return buildHomepage_();
}

function onGmailMessageOpen(e) {
  return buildSidebar_(e);
}

function onComposeOpen(e) {
  return buildCompose_(e);
}

// =====================================
// SIMPLE HOME NAVIGATOR
// =====================================

function navigateToHomepage_(e) {
  const homeCard = buildHomepage_();
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(homeCard))
    .build();
}

// =====================================
// SETUP / SETTINGS
// =====================================

function buildSetupRequiredCard_(fromInvalid) {
  const card = CardService.newCardBuilder();
  const s = CardService.newCardSection();

  card.setHeader(
    CardService.newCardHeader()
      .setTitle("MailCraft AI — Setup")
      .setSubtitle(
        fromInvalid ? "API key / model error" : "Configuration needed"
      )
  );

  if (fromInvalid) {
    s.addWidget(
      CardService.newTextParagraph().setText(
        "❌ API key or model error.\n\n" +
          "Your last request failed because your provider rejected the key.\n\n" +
          "Please update it in Settings."
      )
    );
  } else {
    s.addWidget(
      CardService.newTextParagraph().setText(
        "Setup required.\n\n" + "Please configure your AI provider and API key."
      )
    );
  }

  s.addWidget(
    CardService.newTextButton()
      .setText("⚙️ Settings")
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName("openSettingsFromMenu_")
          .setParameters({ caller: "home" })
      )
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
  );

  card.addSection(s);

  return card.build();
}

// =====================================
// SETTINGS UI
// =====================================

function buildSettingsCard_(e) {
  const { provider, apiKey } = getUserSettings_();
  const existingRules = loadReplyRules_();

  const caller = e?.parameters?.caller || "home";

  let showKey = false;
  let status = "";
  try {
    showKey = e?.parameters?.showKey === "true";
  } catch (_) {}
  try {
    status = e?.parameters?.status || "";
  } catch (_) {}

  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader().setTitle("MailCraft AI — Settings")
  );

  const s = CardService.newCardSection();

  // Back button (context aware)
  s.addWidget(
    CardService.newTextButton()
      .setText("⬅ Back")
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName("navigateBackFromSettings_")
          .setParameters({ caller })
      )
  );

  // STATUS MESSAGE
  if (status === "valid") {
    s.addWidget(
      CardService.newTextParagraph().setText("🟢 API key validated & saved.")
    );
  } else if (status === "invalid") {
    s.addWidget(
      CardService.newTextParagraph().setText(
        "🔴 Invalid API key — please check and try again."
      )
    );
  }

  // Provider
  s.addWidget(CardService.newTextParagraph().setText("API Provider"));

  s.addWidget(
    CardService.newSelectionInput()
      .setFieldName("llm_provider")
      .setTitle("Model Provider")
      .setType(CardService.SelectionInputType.DROPDOWN)
      .addItem("OpenAI (GPT)", "openai", provider === "openai")
      .addItem("Gemini (Google)", "gemini", provider === "gemini")
  );

  // API Key
  s.addWidget(CardService.newTextParagraph().setText("API Key"));

  if (apiKey) {
    if (showKey) {
      s.addWidget(CardService.newTextParagraph().setText(apiKey));
      s.addWidget(
        CardService.newTextButton()
          .setText("🙈 Hide")
          .setOnClickAction(
            CardService.newAction().setFunctionName("hideApiKey_")
          )
          .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
      );
    } else {
      s.addWidget(CardService.newTextParagraph().setText("************"));
      s.addWidget(
        CardService.newTextButton()
          .setText("👁 Show")
          .setOnClickAction(
            CardService.newAction().setFunctionName("showApiKey_")
          )
          .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
      );
    }
  } else {
    s.addWidget(CardService.newTextParagraph().setText("No API key saved."));
  }

  // API Key input
  s.addWidget(
    CardService.newTextInput()
      .setFieldName("llm_api_key")
      .setTitle("Update API Key")
      .setHint("Paste your new API key")
  );

  s.addWidget(
    CardService.newTextButton()
      .setText("💾 Save Keys")
      .setOnClickAction(
        CardService.newAction().setFunctionName("saveUserSettings_")
      )
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
  );

  s.addWidget(CardService.newDivider());

  // Reply rules
  s.addWidget(
    CardService.newTextParagraph().setText(
      "Custom Reply Rules\nApplied to every generated reply."
    )
  );

  s.addWidget(
    CardService.newTextInput()
      .setFieldName("reply_rules_input")
      .setTitle("Reply Rules")
      .setMultiline(true)
      .setValue(existingRules)
  );

  s.addWidget(
    CardService.newTextButton()
      .setText("💾 Save Rules")
      .setOnClickAction(
        CardService.newAction().setFunctionName("saveReplyRulesFromUI_")
      )
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
  );

  card.addSection(s);
  return card.build();
}

// =====================================
// NAVIGATION — CONTEXT AWARE BACK BUTTON
// =====================================

function navigateBackFromSettings_(e) {
  const caller = e?.parameters?.caller || "home";

  if (caller === "compose") {
    const composeCard = buildCompose_({});
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(composeCard))
      .build();
  }

  if (caller === "sidebar") {
    const sidebarCard = buildSidebar_({});
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(sidebarCard))
      .build();
  }

  const home = buildHomepage_();
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(home))
    .build();
}

// =====================================
// Show / hide key
// =====================================

function showApiKey_(e) {
  const card = buildSettingsCard_({ parameters: { showKey: "true" } });
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(card))
    .build();
}

function hideApiKey_(e) {
  const card = buildSettingsCard_({ parameters: { showKey: "false" } });
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(card))
    .build();
}

// =====================================
// Open settings from ANY location
// =====================================

function openSettingsFromMenu_(e) {
  const caller = e?.parameters?.caller || "home";
  const card = buildSettingsCard_({ parameters: { caller } });

  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().pushCard(card))
    .build();
}

// =====================================
// Save API provider + key
// =====================================

function saveUserSettings_(e) {
  let provider = "";
  let apiKey = "";

  try {
    provider =
      e.commonEventObject.formInputs.llm_provider.stringInputs.value[0];
  } catch (_) {}
  try {
    apiKey = e.commonEventObject.formInputs.llm_api_key.stringInputs.value[0];
  } catch (_) {}

  if (!provider || !apiKey) {
    const card = buildSettingsCard_({ parameters: { status: "invalid" } });
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(card))
      .build();
  }

  let valid = false;
  try {
    valid = testLLMKey_(provider, apiKey);
  } catch (_) {}

  if (!valid) {
    const card = buildSettingsCard_({ parameters: { status: "invalid" } });
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(card))
      .build();
  }

  const props = PropertiesService.getUserProperties();
  props.setProperty("llm_provider", provider);
  props.setProperty("llm_api_key", apiKey);
  props.setProperty("setup_completed", "true");

  const card = buildSettingsCard_({ parameters: { status: "valid" } });

  return CardService.newActionResponseBuilder()
    .setNotification(
      CardService.newNotification().setText("🟢 API key validated & saved.")
    )
    .setNavigation(CardService.newNavigation().updateCard(card))
    .build();
}

// =====================================
// Save Reply Rules
// =====================================

function saveReplyRulesFromUI_(e) {
  let rules = "";
  try {
    rules =
      e.commonEventObject.formInputs.reply_rules_input.stringInputs.value[0];
  } catch (_) {}

  saveReplyRules_(rules);

  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("Reply Rules Saved"))
    .addCardAction(
      CardService.newCardAction()
        .setText("Back")
        .setOnClickAction(
          CardService.newAction().setFunctionName("openSettingsFromMenu_")
        )
    );

  const s = CardService.newCardSection();
  s.addWidget(
    CardService.newTextParagraph().setText(
      "✅ Your reply rules were saved successfully."
    )
  );

  card.addSection(s);
  return card.build();
}

// =====================================
// HOMEPAGE
// =====================================

function buildHomepage_() {
  const setupMissing = needsSetup_();

  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("📨 MailCraft AI")
        .setSubtitle("Smart Email Reply Assistant")
    )
    .addCardAction(
      CardService.newCardAction()
        .setText("Settings")
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName("openSettingsFromMenu_")
            .setParameters({ caller: "home" })
        )
    );

  const section = CardService.newCardSection();

  section.addWidget(
    CardService.newTextParagraph().setText(
      "✨ Welcome to MailCraft AI\n" +
        "Craft polished, structured, and professional replies using AI — directly inside Gmail.\n\n" +
        "🔑 API & Model\n" +
        "Your AI provider and key determine which model powers your replies.\n\n" +
        "🧩 Custom Reply Rules\n" +
        "Your rules are applied automatically to every generated response.\n\n" +
        "You can update provider, model, and reply rules at any time in Settings."
    )
  );

  section.addWidget(
    CardService.newTextButton()
      .setText("💡 Help & Tips →")
      .setOnClickAction(
        CardService.newAction().setFunctionName("openHelpAndTips_")
      )
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
  );

  if (setupMissing) {
    section.addWidget(CardService.newDivider());
    section.addWidget(
      CardService.newTextParagraph().setText(
        "⚠️ Setup Required\n" +
          "Please configure your AI provider and API key to start using MailCraft AI."
      )
    );
    section.addWidget(
      CardService.newTextButton()
        .setText("🔧 Settings")
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName("openSettingsFromMenu_")
            .setParameters({ caller: "home" })
        )
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    );
  } else {
    section.addWidget(
      CardService.newTextButton()
        .setText("⚙️ Settings")
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName("openSettingsFromMenu_")
            .setParameters({ caller: "home" })
        )
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    );
  }

  card.addSection(section);
  return card.build();
}

// =====================================
// HELP PAGE
// =====================================

function openHelpAndTips_() {
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("💡 Help & Tips")
        .setSubtitle("Get the most out of MailCraft AI")
    )
    .addCardAction(
      CardService.newCardAction()
        .setText("Home")
        .setOnClickAction(
          CardService.newAction().setFunctionName("navigateToHomepage_")
        )
    );

  const s = CardService.newCardSection();

  s.addWidget(
    CardService.newTextParagraph().setText(
      "🧠 How to Use\n" +
        "• Open an email → click MailCraft AI → generate a reply\n" +
        "• Adjust tone and language before generating\n" +
        "• Edit final text after insertion\n\n" +
        "📏 Formatting Rules\n" +
        "• Blank line after greeting\n" +
        "• Clean paragraphs\n" +
        "• Stable two-line signature\n\n" +
        "🧩 Custom Reply Rules\n" +
        "Use the Settings page to define what should always be included " +
        "or avoided in generated replies.\n\n" +
        "🚀 Best Practices\n" +
        "• Keep your idea short and clear\n" +
        "• Use the tone selector to match email context\n" +
        "• Update custom rules if you want consistent behavior\n\n" +
        "MailCraft AI is designed to save time while keeping your communication polished."
    )
  );

  s.addWidget(
    CardService.newTextButton()
      .setText("⚙️ Settings")
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName("openSettingsFromMenu_")
          .setParameters({ caller: "home" })
      )
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
  );

  card.addSection(s);

  return CardService.newNavigation().pushCard(card.build());
}

// =====================================
// SIDEBAR (VIEW MESSAGE)
// =====================================

function buildSidebar_(e) {
  const { provider, apiKey } = getUserSettings_();
  if (!provider || !apiKey) return buildSetupRequiredCard_(false);

  const cache = CacheService.getUserCache();

  let from = "",
    subject = "",
    latestBody = "",
    fullContext = "";

  try {
    if (e && e.gmail && e.gmail.messageId) {
      const msg = GmailApp.getMessageById(e.gmail.messageId);
      const thread = msg.getThread();
      const messages = thread.getMessages();
      const latest = messages[messages.length - 1];

      from = latest.getFrom();
      subject = latest.getSubject();
      latestBody = stripHtml_(latest.getPlainBody() || latest.getBody());
      fullContext = getThreadContext_(thread);

      cache.put("lastEmailBody", latestBody, 21600);
      cache.put("fullContext", fullContext, 21600);
    }
  } catch (_) {}

  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("MailCraft AI")
        .setSubtitle("Reply Assistant")
    )
    .addCardAction(
      CardService.newCardAction()
        .setText("Settings")
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName("openSettingsFromMenu_")
            .setParameters({ caller: "sidebar" })
        )
    );

  const s = CardService.newCardSection();

  if (from)
    s.addWidget(CardService.newTextParagraph().setText("From: " + from));
  if (subject)
    s.addWidget(CardService.newTextParagraph().setText("Subject: " + subject));
  if (latestBody)
    s.addWidget(
      CardService.newTextParagraph().setText(
        "Latest:\n" + latestBody.substring(0, 300) + "…"
      )
    );

  s.addWidget(
    CardService.newSelectionInput()
      .setFieldName("lang")
      .setTitle("Language")
      .setType(CardService.SelectionInputType.DROPDOWN)
      .addItem("Auto Detect", "auto", true)
      .addItem("English", "english", false)
      .addItem("German", "german", false)
      .addItem("French", "french", false)
      .addItem("Spanish", "spanish", false)
      .addItem("Italian", "italian", false)
  );

  s.addWidget(
    CardService.newSelectionInput()
      .setFieldName("tone")
      .setTitle("Tone")
      .setType(CardService.SelectionInputType.DROPDOWN)
      .addItem("🧑‍💼 Formal — professional & structured", "formal", true)
      .addItem("😐 Neutral — balanced & clear", "neutral", false)
      .addItem("🙂 Friendly — warm & approachable", "friendly", false)
      .addItem("✂️ Concise — short & direct", "concise", false)
      .addItem("💪 Assertive — confident & strong", "assertive", false)
      .addItem("🤩 Enthusiastic — energetic & positive", "enthusiastic", false)
      .addItem("🙏 Apologetic — soft & regretful", "apologetic", false)
  );

  s.addWidget(
    CardService.newTextInput()
      .setFieldName("idea")
      .setTitle("Your reply idea")
      .setMultiline(true)
  );

  s.addWidget(
    CardService.newTextButton()
      .setText("✨ Generate Reply")
      .setOnClickAction(
        CardService.newAction().setFunctionName("generateSidebarReply_")
      )
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
  );

  card.addSection(s);
  return card.build();
}

// =====================================
// SIDEBAR — GENERATE REPLY
// =====================================

function generateSidebarReply_(e) {
  const { provider, apiKey } = getUserSettings_();
  if (!provider || !apiKey) return buildSetupRequiredCard_(false);

  const cache = CacheService.getUserCache();

  let idea = "",
    lang = "auto",
    tone = "formal";

  try {
    idea = e.commonEventObject.formInputs.idea.stringInputs.value[0];
  } catch (_) {}
  try {
    lang = e.commonEventObject.formInputs.lang.stringInputs.value[0];
  } catch (_) {}
  try {
    tone = e.commonEventObject.formInputs.tone.stringInputs.value[0];
  } catch (_) {}

  if (!idea) {
    const card = CardService.newCardBuilder();
    const s = CardService.newCardSection();
    s.addWidget(
      CardService.newTextParagraph().setText("⚠️ Enter a reply idea.")
    );
    card.addSection(s);
    return card.build();
  }

  const fullContext = cache.get("fullContext") || "";
  const latestEmail = cache.get("lastEmailBody") || "";
  const customRules = loadReplyRules_();

  const toneInst = getToneInstruction_(tone);
  const langInst =
    lang === "auto"
      ? "Write the reply in the same language as the thread."
      : "Write the email in " + lang + ".";

  const prompt =
    "You are an advanced email assistant.\n\n" +
    toneInst +
    "\n\nEMAIL THREAD CONTEXT:\n" +
    fullContext +
    "\n\nLATEST MESSAGE:\n" +
    latestEmail +
    "\n\nUSER IDEA:\n" +
    idea +
    "\n\nUSER CUSTOM RULES (HIGHEST PRIORITY):\n" +
    (customRules || "No custom rules provided.") +
    "\n\nINTERPRETATION RULE:\n" +
    "- Only override default behavior IF the custom rules explicitly mention something.\n" +
    "- If a topic is NOT mentioned in the custom rules, follow the standard default formatting and tone rules.\n" +
    "- Custom rules DO NOT require perfect wording — infer intention.\n" +
    "\n\nMAILCRAFT DEFAULT RULES (APPLY WHEN USER PROVIDES NO SPECIFIC RULE):\n" +
    "- Clean paragraphs\n" +
    "- No placeholders\n" +
    "- Blank line after greeting\n" +
    "- Separate paragraphs\n" +
    "- Blank line before sign-off\n" +
    "- Respect the selected tone\n" +
    "- Respect the detected/selected language\n" +
    "- Infer sender name ONLY if user’s rules do not specify a signature\n" +
    "\n\nSIGNATURE RULE:\n" +
    "- If the user provides a signature in the custom rules, use it EXACTLY.\n" +
    "- If no custom signature is provided, infer sender name normally.\n" +
    "\n\nOUTPUT LANGUAGE RULE:\n" +
    "- " +
    langInst;

  const reply = callLLM_(provider, apiKey, prompt);

  const resultCard = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("Generated Reply"))
    .addCardAction(
      CardService.newCardAction()
        .setText("Settings")
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName("openSettingsFromMenu_")
            .setParameters({ caller: "sidebar" })
        )
    );

  const s = CardService.newCardSection();
  s.addWidget(CardService.newTextParagraph().setText(reply));

  resultCard.addSection(s);

  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().pushCard(resultCard.build()))
    .build();
}

// =====================================
// COMPOSE MODE — PAGE 1
// =====================================

function buildCompose_(e) {
  const { provider, apiKey } = getUserSettings_();
  if (!provider || !apiKey) return buildSetupRequiredCard_(false);

  const cache = CacheService.getUserCache();
  const latestEmail = cache.get("lastEmailBody") || "";

  let detectedLang = "english";
  try {
    if (latestEmail) detectedLang = detectLanguageMinimal_(latestEmail);
  } catch (_) {}

  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("MailCraft AI")
        .setSubtitle("Compose Reply")
    )
    .addCardAction(
      CardService.newCardAction()
        .setText("Settings")
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName("openSettingsFromMenu_")
            .setParameters({ caller: "compose" })
        )
    );

  const s = CardService.newCardSection();

  s.addWidget(
    CardService.newSelectionInput()
      .setFieldName("lang")
      .setTitle("Language")
      .setType(CardService.SelectionInputType.DROPDOWN)
      .addItem("English 🇬🇧", "english", detectedLang === "english")
      .addItem("German 🇩🇪", "german", detectedLang === "german")
      .addItem("French 🇫🇷", "french", detectedLang === "french")
      .addItem("Spanish 🇪🇸", "spanish", detectedLang === "spanish")
      .addItem("Italian 🇮🇹", "italian", detectedLang === "italian")
  );

  s.addWidget(
    CardService.newSelectionInput()
      .setFieldName("tone")
      .setTitle("Tone")
      .setType(CardService.SelectionInputType.DROPDOWN)
      .addItem("🧑‍💼 Formal", "formal", true)
      .addItem("😐 Neutral", "neutral", false)
      .addItem("🙂 Friendly", "friendly", false)
      .addItem("✂️ Concise", "concise", false)
      .addItem("💪 Assertive", "assertive", false)
      .addItem("🤩 Enthusiastic", "enthusiastic", false)
      .addItem("🙏 Apologetic", "apologetic", false)
  );

  s.addWidget(
    CardService.newTextInput()
      .setFieldName("idea")
      .setTitle("Your reply idea")
      .setMultiline(true)
  );

  s.addWidget(
    CardService.newTextButton()
      .setText("✨ Generate Reply")
      .setOnClickAction(
        CardService.newAction().setFunctionName("generateComposeReply_")
      )
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
  );

  card.addSection(s);
  return card.build();
}

// =====================================
// COMPOSE MODE — PAGE 2 (PREVIEW)
// =====================================

function generateComposeReply_(e) {
  const { provider, apiKey } = getUserSettings_();
  if (!provider || !apiKey) return buildSetupRequiredCard_(false);

  const cache = CacheService.getUserCache();

  let idea = "",
    lang = "english",
    tone = "formal";

  try {
    idea = e.commonEventObject.formInputs.idea.stringInputs.value[0];
  } catch (_) {}
  try {
    lang = e.commonEventObject.formInputs.lang.stringInputs.value[0];
  } catch (_) {}
  try {
    tone = e.commonEventObject.formInputs.tone.stringInputs.value[0];
  } catch (_) {}

  const fullContext = cache.get("fullContext") || "";
  const latestEmail = cache.get("lastEmailBody") || "";
  const customRules = loadReplyRules_();

  const toneInst = getToneInstruction_(tone);

  const prompt =
    "You are an advanced email assistant.\n\n" +
    toneInst +
    "\n\nEMAIL THREAD (context):\n" +
    fullContext +
    "\n\nLATEST MESSAGE:\n" +
    latestEmail +
    "\n\nUSER IDEA:\n" +
    idea +
    "\n\nUSER CUSTOM RULES (HIGHEST PRIORITY):\n" +
    (customRules || "No custom rules provided.") +
    "\n\nINTERPRETATION RULE:\n" +
    "- Only override default behavior IF the custom rules explicitly mention something.\n" +
    "- If a topic is NOT mentioned in the custom rules, follow the standard default formatting and tone rules.\n" +
    "- Custom rules DO NOT require perfect wording — infer intention.\n" +
    "\n\nMAILCRAFT DEFAULT RULES (APPLY WHEN USER PROVIDES NO SPECIFIC RULE):\n" +
    "- Clean paragraphs\n" +
    "- No placeholders\n" +
    "- Blank line after greeting\n" +
    "- Separate paragraphs\n" +
    "- Blank line before sign-off\n" +
    "- Respect the selected tone\n" +
    "- Respect the detected/selected language\n" +
    "- Infer sender name ONLY if user’s rules do not specify a signature\n" +
    "\n\nSIGNATURE RULE:\n" +
    "- If the user provides a signature in the custom rules, use it EXACTLY.\n" +
    "- If no custom signature is provided, infer sender name normally.\n" +
    "\n\nOUTPUT LANGUAGE RULE:\n" +
    "- Write the email in " +
    lang +
    ".";

  const reply = callLLM_(provider, apiKey, prompt);
  const cleanReply = reply.replace(/\\n/g, "\n");
  const formattedReply = normalizeEmailFormatting_(cleanReply);

  cache.put("compose_generatedReply", formattedReply, 600);

  const previewCard = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("Preview Reply"))
    .addCardAction(
      CardService.newCardAction()
        .setText("Settings")
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName("openSettingsFromMenu_")
            .setParameters({ caller: "compose" })
        )
    );

  const s = CardService.newCardSection();

  s.addWidget(CardService.newTextParagraph().setText(formattedReply));

  s.addWidget(
    CardService.newTextButton()
      .setText("⬅ Back")
      .setOnClickAction(
        CardService.newAction().setFunctionName("backToComposeFromPreview_")
      )
  );

  s.addWidget(
    CardService.newTextButton()
      .setText("📥 Insert into Email")
      .setOnClickAction(
        CardService.newAction().setFunctionName("insertComposeReply_")
      )
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
  );

  previewCard.addSection(s);

  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().pushCard(previewCard.build()))
    .build();
}

function backToComposeFromPreview_(e) {
  const card = buildCompose_(e);
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(card))
    .build();
}

// =====================================
// INSERT INTO DRAFT (HTML)
// =====================================

function insertComposeReply_(e) {
  const cache = CacheService.getUserCache();
  let reply = cache.get("compose_generatedReply") || "";

  if (!reply) {
    return CardService.newUpdateDraftActionResponseBuilder().build();
  }

  let html = reply
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n{2,}/g, "<br><br>")
    .replace(/\n/g, "<br>");

  html = "<div>" + html + "</div>";

  const upd = CardService.newUpdateDraftBodyAction()
    .addUpdateContent("<br><br>" + html, CardService.ContentType.MUTABLE_HTML)
    .setUpdateType(CardService.UpdateDraftBodyType.IN_PLACE_INSERT);

  return CardService.newUpdateDraftActionResponseBuilder()
    .setUpdateDraftBodyAction(upd)
    .build();
}
