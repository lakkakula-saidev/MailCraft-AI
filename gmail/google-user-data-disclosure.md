# Google User Data Disclosure for MailCraft AI
_Last updated: 2025-02-20_

MailCraft AI is a Gmail Add-on that helps users create professional, safe, and well-structured email replies using third-party AI models (OpenAI GPT or Google Gemini).  
This document discloses how the add-on handles, processes, stores, and shares Google user data in compliance with Google API Services User Data Policy.

---

## 1. What Data the Add-on Can Access
MailCraft AI can access only the data required to function:

### Gmail Data (via Gmail Add-on Scopes)
- Sender name and email address  
- Subject line  
- Email message body  
- Email thread content  
- Draft metadata  
- User-typed content (idea, tone, language, custom rules)

### App Settings
- LLM provider selected by the user  
- User-provided API key  
- User-defined reply rules  

---

## 2. Why This Data Is Accessed
MailCraft AI accesses Gmail message content **only when the user opens a message** and **only to generate a reply they explicitly request**.

Data is used for:
- Displaying the message
- Providing context to AI
- Generating a professional email draft

MailCraft AI does **not** access or process Gmail data in the background.

---

## 3. How Data Is Processed
When the user requests a reply:

1. The add-on takes the relevant email content and user input.  
2. Sends it only to the selected AI provider (OpenAI or Gemini).  
3. Receives a suggested response.  
4. Helps insert the reply into a Gmail draft.

No developer backend or third-party servers are involved.

---

## 4. Data Storage
### Stored (locally inside user’s Google account)
- API key  
- Provider preference  
- Custom reply rules  

Stored using **UserProperties (Google Apps Script)**.

### NOT Stored Anywhere
- Emails  
- Message metadata  
- AI responses  
- User identity  
- Logs  
- Analytics  

---

## 5. Data Sharing
The add-on shares **no Gmail data with the developer**.

Data is shared ONLY when:
- The user explicitly presses "Generate Reply"

Shared ONLY with:
- OpenAI or Google Gemini  
- Over secure HTTPS  

The developer **cannot view, log, or access any user data**.

---

## 6. User Control
Users can:
- Change or delete API keys  
- Change providers  
- Delete custom rules  
- Uninstall the add-on  
- Revoke Gmail permissions at any time  

---

## 7. Compliance
MailCraft AI complies with:
- Google API Services User Data Policy  
- Limited Use Policy  
- Gmail Add-on platform restrictions  
- Google Workspace Marketplace safety requirements  

---

## 8. Support & Contact

For issues, bug reports, and questions:

**Email:** lakkakula.saidev@gmail.com

**GitHub Issues:** https://github.com/lakkakula-saidev/MailCraft-AI/issues  