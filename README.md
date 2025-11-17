# MailCraft AI

MailCraft AI is an email-crafting assistant that turns complex threads into polished replies. The project aims to provide the same experience across multiple mail clients (Gmail today, with Outlook and other providers planned). Each add-on shares the same high-level behavior—capture the conversation context, let the user choose a tone or reply idea, and call a configurable AI provider to draft the response. This repository hosts those add-on implementations alongside their assets and deployment notes so you can customize or self-host MailCraft AI on the platform of your choice.

## Project highlights

- **Cross-provider vision** – The codebase is organized so new client-specific add-ons (e.g., Outlook) can live beside the existing Gmail implementation.
- **Bring-your-own model** – Users can plug in OpenAI or Google Gemini keys (with support for other models planned) without sharing credentials with third parties.
- **Secure-by-design** – Secrets are stored in each platform's native property store, and failures automatically clear invalid keys.
- **Guided experience** – Step-by-step instructions, contextual cards, and compose-mode helpers ensure users know exactly what the AI sees before sending a reply.

## Repository layout

```
.
├── README.md
└── gmail/
    ├── code.gs                     # Gmail add-on entry points and UI builders
    ├── helper.gs                   # Shared utilities, API callers, and helpers
    ├── appsscript.json             # Project manifest, scopes, and triggers
    ├── MailCraft AI.png            # Primary square logo asset
    └── MailCraft AI rounded.png    # Rounded logo used by the manifest
```

Additional add-ons (such as Outlook) will eventually sit beside the `gmail/` folder with their own platform-specific manifests and scripts.

## Working with this repository locally

If you are editing the code outside of this environment, a few Git steps ensure the changes land in the right place:

1. **Confirm your branch** – run `git status -sb` to see whether you are on `work` (the default branch in this dev container) or `main`. The branch you are on is the one Git will try to push.
2. **Set or verify the remote** – `git remote -v` should list `origin  https://github.com/lakkakula-saidev/MailCraft-AI.git (fetch/push)`. If it does not, add it once with `git remote add origin https://github.com/lakkakula-saidev/MailCraft-AI.git`.
3. **Push the branch you are on** – use `git push origin <current-branch>:main` if you want GitHub’s `main` branch to mirror your work. For example, when working on `work`, run `git push origin work:main`; when on `main`, simply run `git push origin main`.
4. **Open a PR (optional)** – if you would rather keep `main` pristine, push to a similarly named remote branch (`git push origin work`) and open a PR from GitHub’s UI.

These steps match what you would do in VS Code’s terminal, so you can copy/paste the commands directly whenever you need to publish the latest README or manifest changes upstream.

### Branding assets

MailCraft AI currently ships with two logo variants stored under `gmail/` so you can keep the Apps Script manifest referencing assets that live inside this repository:

- `MailCraft AI.png` – the original square icon that works well when you upload assets manually in the Google Workspace Marketplace UI.
- `MailCraft AI rounded.png` – the image referenced by `gmail/appsscript.json` via the GitHub raw URL (`https://raw.githubusercontent.com/lakkakula-saidev/MailCraft-AI/main/gmail/MailCraft%20AI%20rounded.png`). If you fork this project or move the file, remember to update the manifest so the logo keeps loading.

---

# Gmail add-on

The current release targets Gmail via a Google Workspace add-on written entirely in Google Apps Script. It can be deployed through the Apps Script editor or clasp and gives every Gmail user an AI copilot inside the right-hand sidebar and compose window.

## Features

- **Homepage guidance** – Shows quick instructions or a setup prompt when no message is selected.
- **Contextual sidebar** – Reads the selected Gmail thread, caches the latest message, and displays sender/subject excerpts so users know what the AI sees.
- **Smart reply generation** – Sends a full-thread prompt to either OpenAI (GPT-4o mini) or Google Gemini, respecting the user's reply idea and language choice.
- **Compose integration** – Adds a compose trigger that can insert generated replies directly into the Gmail draft body.
- **Settings flow** – Provides a card-based UI for saving provider/API key pairs, validating them immediately, and surfacing invalid-key errors.
- **Safety checks** – Requires setup before any reply generation and clears API keys if the provider returns an authentication failure.

## Prerequisites

- A Google Workspace account with permission to deploy Gmail add-ons.
- An API key for one of the supported providers:
  - OpenAI (tested with `gpt-4o-mini`).
  - Google Gemini (`gemini-pro`).

## Local development & deployment

1. **Open Apps Script**
   - Visit [script.google.com](https://script.google.com) and create a new project.
   - Upload the files from the `gmail/` directory (`code.gs`, `helper.gs`, and `appsscript.json`).
   - Replace the default manifest with `appsscript.json` to ensure the correct scopes and triggers are enabled.

2. **Add the logo**
   - In the Apps Script editor, go to **Project Settings → Google Cloud Platform (GCP) project** and make sure the add-on uses a GCP project where you can upload the provided `MailCraft AI.png` as the add-on logo (or use your own branding).

3. **Enable APIs**
   - Confirm that the Apps Script project has access to Gmail scopes listed in the manifest and the `UrlFetchApp` service (enabled by default).

4. **Test the add-on**
   - Click **Test deployments → Select type: Add-on** to run the Gmail preview.
   - Open a Gmail message and launch MailCraft AI from the right sidebar to verify the contextual UI, settings flow, and reply generation.

5. **Deploy**
   - Use **Deploy → Test deployments** for internal testing or **Deploy → Deploy from manifest…** to publish to your workspace domain.

## Usage tips

- **First run:** open MailCraft AI from the Gmail sidebar, go to **Settings**, pick `OpenAI` or `Gemini`, and paste your API key. The add-on validates the key instantly.
- **Generating replies:** select an email thread, optionally type a short idea, choose a language, and click **✨ Generate Reply**. The response appears in a new card for copy/paste or, in compose mode, it is inserted into the draft automatically.
- **Troubleshooting:** if a provider rejects the API key, MailCraft AI clears the stored key and shows an error card prompting you to reconfigure your settings.

## License

This repository is provided as-is for personal or organizational use. Customize branding, models, or prompts to fit your needs.
