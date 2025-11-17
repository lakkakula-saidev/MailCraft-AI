/**
 * MailCraft AI — Gmail Add-on (Stable)
 * Author: Saidev
 */

// =====================================
// ENTRY POINTS
// =====================================
function onHomepage() {
  return buildHomepage_();
}

function onGmailMessageOpen(e) {
  // Always show the main sidebar card (it will internally check if setup is needed)
  return buildSidebar_(e);
}

function onComposeOpen(e) {
  return buildCompose_(e);
}

// =====================================
// SHARED "SETUP REQUIRED" CARD
// =====================================
function buildSetupRequiredCard_(fromInvalid) {
  const card = CardService.newCardBuilder();
  const s = CardService.newCardSection();

  if (fromInvalid) {
    const props = PropertiesService.getUserProperties();
    const reason =
      props.getProperty("llm_invalid_reason") ||
      "Your API key or model is invalid.";

    s.addWidget(
      CardService.newTextParagraph().setText(
        "❌ <b>API key / model error</b><br><br>" +
          "The last request failed because the provider reported an invalid key or model.<br><br>" +
          "<i>" +
          reason.substring(0, 500) +
          "</i><br><br>" +
          "Please update your API key / model in Settings."
      )
    );
  } else {
    s.addWidget(
      CardService.newTextParagraph().setText(
        "<b>Setup required</b><br><br>" +
          "Please configure your AI provider and API key in Settings before using MailCraft AI."
      )
    );
  }

  s.addWidget(
    CardService.newTextButton()
      .setText("⚙️ Open Settings")
      .setOnClickAction(
        CardService.newAction().setFunctionName("openSettingsFromMenu_")
      )
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
  );

  card.addSection(s);
  return card.build();
}

// =====================================
// SETTINGS FLOW
// =====================================
function buildSettingsCard_() {
  const { provider } = getUserSettings_();

  const card = CardService.newCardBuilder().setHeader(
    CardService.newCardHeader().setTitle("MailCraft AI — Settings")
  );

  const s = CardService.newCardSection();

  s.addWidget(
    CardService.newTextParagraph().setText(
      "Configure your AI provider and API key."
    )
  );

  s.addWidget(
    CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.DROPDOWN)
      .setTitle("Select AI Provider")
      .setFieldName("llm_provider")
      .addItem("OpenAI (GPT)", "openai", provider === "openai")
      .addItem("Gemini (Google)", "gemini", provider === "gemini")
  );

  s.addWidget(
    CardService.newTextInput()
      .setTitle("API Key")
      .setFieldName("llm_api_key")
      .setHint("Paste your provider API key")
  );

  const save = CardService.newAction().setFunctionName("saveUserSettings_");

  s.addWidget(
    CardService.newTextButton()
      .setText("💾 Save & Verify")
      .setOnClickAction(save)
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
  );

  s.addWidget(
    CardService.newTextParagraph().setText(
      "🔒 Your API key is stored securely."
    )
  );

  card.addSection(s);
  return card.build();
}

function openSettingsFromMenu_(e) {
  return buildSettingsCard_();
}

/**
 * Save + verify settings.
 * IMPORTANT:
 *  - No separate "success + continue" card.
 *  - We reset navigation using popToRoot().updateCard(...)
 */
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
    return CardService.newCardBuilder()
      .addSection(
        CardService.newCardSection().addWidget(
          CardService.newTextParagraph().setText("⚠️ Please enter both values.")
        )
      )
      .build();
  }

  let isValid = false;
  try {
    isValid = testLLMKey_(provider, apiKey);
  } catch (_) {}

  if (!isValid) {
    const card = CardService.newCardBuilder();
    const s = CardService.newCardSection();
    s.addWidget(
      CardService.newTextParagraph().setText("❌ Invalid API key or provider.")
    );
    s.addWidget(
      CardService.newTextButton()
        .setText("Back to Settings")
        .setOnClickAction(
          CardService.newAction().setFunctionName("openSettingsFromMenu_")
        )
    );
    card.addSection(s);
    return card.build();
  }

  const props = PropertiesService.getUserProperties();
  props.setProperty("llm_provider", provider);
  props.setProperty("llm_api_key", apiKey);
  props.deleteProperty("llm_invalid_reason");

  // Decide where to send user back: sidebar, compose, or homepage.
  // Then wipe navigation with popToRoot().updateCard(...)
  let messageId = "";
  let isCompose = false;

  try {
    if (e && e.gmail && e.gmail.messageId) messageId = e.gmail.messageId;
  } catch (_) {}

  try {
    if (!messageId && e && e.messageMetadata && e.messageMetadata.messageId)
      messageId = e.messageMetadata.messageId;
  } catch (_) {}

  try {
    const ctx = e && e.commonEventObject && e.commonEventObject.hostAppContext;
    if (ctx && ctx.composeMode === true) isCompose = true;
  } catch (_) {}

  try {
    if (!isCompose && e && e.draftMetadata) isCompose = true;
  } catch (_) {}

  let destCard;
  if (messageId) {
    destCard = buildSidebar_({ gmail: { messageId } });
  } else if (isCompose) {
    destCard = buildCompose_(e);
  } else {
    destCard = buildHomepage_();
  }

  // CHOOSE DESTINATION CARD (sidebar / compose / homepage)
  if (isCompose) {
    return buildCompose_(e);
  }

  // Homepage fallback
  return buildHomepage_();
}

// =====================================
// HOMEPAGE (when NO email selected)
// =====================================
function buildHomepage_() {
  const setupMissing = needsSetup_();
  const card = CardService.newCardBuilder();
  const s = CardService.newCardSection();

  if (setupMissing) {
    // FIRST-TIME case or after invalid key → show setup required
    return buildSetupRequiredCard_(false);
  }

  // Setup complete → normal (clean) homepage
  s.addWidget(
    CardService.newTextParagraph().setText(
      "📬 <b>MailCraft AI</b><br><br>" +
        "Open an email to generate AI-powered replies.<br>" +
        "Use <b>Settings</b> to change your AI provider or API key."
    )
  );

  s.addWidget(
    CardService.newTextButton()
      .setText("⚙️ Settings")
      .setOnClickAction(
        CardService.newAction().setFunctionName("openSettingsFromMenu_")
      )
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
  );

  card.addSection(s);
  return card.build();
}

// =====================================
// SIDEBAR (email opened)
// =====================================
function buildSidebar_(e) {
  const cache = CacheService.getUserCache();
  const { provider, apiKey } = getUserSettings_();
  const setupMissing = !provider || !apiKey;

  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("MailCraft AI")
        .setSubtitle("Smart Email Assistant")
    )
    .addCardAction(
      CardService.newCardAction()
        .setText("Settings")
        .setOnClickAction(
          CardService.newAction().setFunctionName("openSettingsFromMenu_")
        )
    );

  const s = CardService.newCardSection();

  let from = "";
  let subject = "";
  let body = "";

  // Safely read message context if available
  try {
    if (e && e.gmail && e.gmail.messageId) {
      const msg = GmailApp.getMessageById(e.gmail.messageId);
      const thread = msg.getThread();
      const messages = thread.getMessages();
      const latest = messages[messages.length - 1];

      from = latest.getFrom();
      subject = latest.getSubject();
      body = stripHtml_(latest.getPlainBody() || latest.getBody());

      const fullContext = getThreadContext_(thread);

      cache.put("lastEmailBody", latest.getPlainBody() || "", 21600); // 6h
      cache.put("fullContext", fullContext, 21600);
    }
  } catch (_) {}

  // Always show these details so users understand context
  s.addWidget(
    CardService.newTextParagraph().setText("📧 Full thread context enabled.")
  );

  if (from) {
    s.addWidget(CardService.newTextParagraph().setText("<b>From:</b> " + from));
  }

  if (subject) {
    s.addWidget(
      CardService.newTextParagraph().setText("<b>Subject:</b> " + subject)
    );
  }

  if (body) {
    s.addWidget(
      CardService.newTextParagraph().setText(
        "<b>Latest:</b><br>" + body.substring(0, 300) + "…"
      )
    );
  }

  if (setupMissing) {
    // NO API KEY → show setup card (Bug 2 fix)
    card.addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph().setText(
            "<br><b>Setup required</b><br>" +
              "To generate replies, please configure your AI provider and API key in Settings."
          )
        )
        .addWidget(
          CardService.newTextButton()
            .setText("⚙️ Open Settings")
            .setOnClickAction(
              CardService.newAction().setFunctionName("openSettingsFromMenu_")
            )
            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        )
    );
    return card.build();
  }

  // ============================
  // If setup is complete → full Generate Reply UI
  // ============================

  // Language dropdown
  s.addWidget(
    CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.DROPDOWN)
      .setTitle("Select Target Language")
      .setFieldName("lang")
      .addItem("Auto Detect", "auto", true)
      .addItem("English", "english", false)
      .addItem("German", "german", false)
      .addItem("French", "french", false)
      .addItem("Spanish", "spanish", false)
      .addItem("Italian", "italian", false)
  );

  // Boxed textarea look
  s.addWidget(
    CardService.newTextParagraph().setText(
      '<div style="border:1px solid #ccc; border-radius:6px; padding:8px;">'
    )
  );

  s.addWidget(
    CardService.newTextInput()
      .setFieldName("idea")
      .setMultiline(true)
      .setTitle("Your reply idea")
      .setHint("Type your reply idea…")
  );

  s.addWidget(CardService.newTextParagraph().setText("</div>"));

  // Generate button
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
// GENERATE SIDEBAR REPLY
// =====================================
function generateSidebarReply_(e) {
  const { provider, apiKey } = getUserSettings_();
  const cache = CacheService.getUserCache();

  if (!provider || !apiKey) {
    // Extra safety — if somehow triggered without setup, show message
    return buildSetupRequiredCard_(false);
  }

  let idea = "";
  let lang = "auto";

  try {
    idea = e.commonEventObject.formInputs.idea.stringInputs.value[0];
  } catch (_) {}

  try {
    lang = e.commonEventObject.formInputs.lang.stringInputs.value[0];
  } catch (_) {}

  if (!idea) {
    return CardService.newCardBuilder()
      .addSection(
        CardService.newCardSection().addWidget(
          CardService.newTextParagraph().setText("⚠️ Enter a reply idea.")
        )
      )
      .build();
  }

  const fullContext = cache.get("fullContext") || "";
  const latestEmail = cache.get("lastEmailBody") || "";

  const inst =
    lang === "auto"
      ? "Write the reply in the same language."
      : "Write the reply in " + lang + ".";

  const prompt =
    "You are an advanced email assistant.\n\n" +
    "FULL THREAD:\n" +
    fullContext +
    "\n\n" +
    "LATEST MESSAGE:\n" +
    latestEmail +
    "\n\n" +
    "USER IDEA:\n" +
    idea +
    "\n\n" +
    inst +
    "\n" +
    "Write a natural, context-aware reply. No subject, no placeholders.";

  const reply = callLLM_(provider, apiKey, prompt);

  // If key was invalidated → show setup required with error reason
  if (reply === "__INVALID_API_KEY__") {
    return buildSetupRequiredCard_(true);
  }

  const c = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("MailCraft AI — Reply"))
    .addSection(
      CardService.newCardSection().addWidget(
        CardService.newTextParagraph().setText(reply)
      )
    )
    .build();

  // Back once → goes to Generate UI (root after popToRoot)
  return CardService.newNavigation().pushCard(c);
}

// =====================================
// COMPOSE VIEW
// =====================================
function buildCompose_(e) {
  const { provider, apiKey } = getUserSettings_();
  const setupMissing = !provider || !apiKey;

  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("MailCraft AI")
        .setSubtitle("Compose smarter replies")
    )
    .addCardAction(
      CardService.newCardAction()
        .setText("Settings")
        .setOnClickAction(
          CardService.newAction().setFunctionName("openSettingsFromMenu_")
        )
    );

  const s = CardService.newCardSection();

  if (setupMissing) {
    // Restrict usage in compose until setup
    card.addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph().setText(
            "<b>Setup required</b><br>" +
              "To generate emails, please configure your AI provider and API key in Settings."
          )
        )
        .addWidget(
          CardService.newTextButton()
            .setText("⚙️ Open Settings")
            .setOnClickAction(
              CardService.newAction().setFunctionName("openSettingsFromMenu_")
            )
            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        )
    );
    return card.build();
  }

  // If setup is complete → normal compose UI
  s.addWidget(
    CardService.newTextParagraph().setText(
      '<div style="border:1px solid #ccc; border-radius:6px; padding:8px;">'
    )
  );

  s.addWidget(
    CardService.newTextInput()
      .setFieldName("idea")
      .setMultiline(true)
      .setTitle("Your reply idea")
      .setHint("Type your reply idea…")
  );

  s.addWidget(CardService.newTextParagraph().setText("</div>"));

  s.addWidget(
    CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.DROPDOWN)
      .setTitle("Select Language")
      .setFieldName("lang")
      .addItem("English 🇬🇧", "english", true)
      .addItem("German 🇩🇪", "german", false)
      .addItem("French 🇫🇷", "french", false)
      .addItem("Spanish 🇪🇸", "spanish", false)
      .addItem("Italian 🇮🇹", "italian", false)
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

function generateComposeReply_(e) {
  const { provider, apiKey } = getUserSettings_();

  if (!provider || !apiKey) {
    return buildSetupRequiredCard_(false);
  }

  let idea = "";
  let lang = "english";

  try {
    idea = e.commonEventObject.formInputs.idea.stringInputs.value[0];
  } catch (_) {}

  try {
    lang = e.commonEventObject.formInputs.lang.stringInputs.value[0];
  } catch (_) {}

  if (!idea) {
    return CardService.newUpdateDraftActionResponseBuilder().build();
  }

  const prompt =
    "Write a concise, polite email in " +
    lang +
    " based on this idea:\n\n" +
    idea +
    "\n\nNo subject or placeholders.";

  const reply = callLLM_(provider, apiKey, prompt);

  if (reply === "__INVALID_API_KEY__") {
    return buildSetupRequiredCard_(true);
  }

  const upd = CardService.newUpdateDraftBodyAction()
    .addUpdateContent("\n\n" + reply, CardService.ContentType.PLAIN_TEXT)
    .setUpdateType(CardService.UpdateDraftBodyType.REPLACE);

  return CardService.newUpdateDraftActionResponseBuilder()
    .setUpdateDraftBodyAction(upd)
    .build();
}
