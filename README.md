# MailCraft AI — Gmail Add-on (2025)

MailCraft AI is an intelligent email-writing assistant that transforms Gmail threads into polished, structured replies — directly inside Gmail.  
It uses your **own API keys** (OpenAI or Google Gemini), stored securely in your Google account.

This repository contains the complete Gmail Add-on implementation, including UI logic, LLM integration, and manifest.

---

## ✨ Features (Latest Release)

### ✔ Full Gmail Integration
- Sidebar when reading messages  
- Compose mode reply generator  
- Live preview  
- One-click HTML insertion  
- Homepage guidance  

### ✔ Bring Your Own LLM
- **OpenAI GPT-4o-mini**  
- **Google Gemini-Pro**  
- No external servers  
- No backend required  

### ✔ Smart Context Awareness
- Reads entire Gmail thread  
- Extracts latest message  
- Cleans formatting  
- Produces professional replies  

### ✔ Tone Selector
- Formal  
- Neutral  
- Friendly  
- Concise  
- Assertive  
- Enthusiastic  
- Apologetic  

### ✔ Custom Reply Rules (Persistent)
- Saved in UserProperties  
- Always applied  
- Overrides default behaviors  

### ✔ Auto Language Detection
- English  
- German  
- French  
- Spanish  
- Italian  

### ✔ Advanced Formatting Engine
- Cleans LLM output  
- Adds proper spacing  
- Normalizes greetings & sign-offs  
- Converts safely into Gmail HTML  

### ✔ Robust Safety
- Setup gating  
- Invalid API key detection  
- Auto-clear broken keys  

---

## 📁 Repository Structure
<pre>
MailCraft AI/
    └── gmail/
        ├── code.gs
        ├── helper.gs
        ├── appsscript.json
        └── icons...
</pre>

---

## 🚀 Quick Start

### 1. Open Google Apps Script
https://script.google.com

### 2. Create a new project and upload:
- `code.gs`
- `helper.gs`
- `appsscript.json`

### 3. Replace the manifest
Go to:  
**Project Settings → Show manifest file**  
Paste the updated `appsscript.json`.

### 4. Test the add-on
**Deploy → Test deployments → Add-on**  
Open Gmail → Right sidebar → **MailCraft AI**

---

## 🔧 First-Time Setup

Inside Gmail, open:  
**MailCraft AI → Settings**

Configure:

- Model Provider (OpenAI / Gemini)  
- API Key  
- Optional Reply Rules  

Your key is validated instantly and stored securely.

---

## 🧠 How the Add-on Works

1. Reads Gmail thread metadata  
2. Extracts full conversation context  
3. Determines tone, language, and rules  
4. Builds structured LLM prompt  
5. Sends request to OpenAI or Gemini  
6. Runs a normalization pass  
7. Inserts reply into Gmail draft (compose mode)

Everything is processed **client-side** within Apps Script.

---

## 🛠 Technical Details

- Google Apps Script **V8 runtime**  
- Uses **CardService** for the Gmail UI  
- Uses **UrlFetchApp** for LLM calls  
- Uses **UserProperties** for secure storage  
- Built-in caching for performance  
- Full sanitization + normalization pipeline  

---

## 🆘 Support

🐛 **Issues & Feature Requests:**  
https://github.com/lakkakula-saidev/MailCraft-AI/issues  

📧 **Email Support:**  
lakkakula.saidev@gmail.com  

---

## 📄 License

MIT — free to modify, customize, and deploy.

---

## ⭐ Contributing

Pull requests are welcome!  
If you want help adding Outlook, extension support, or more model providers, open an issue.
