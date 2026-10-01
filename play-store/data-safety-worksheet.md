# Play Data Safety Worksheet

This is an accurate starting point for the Google Play Console Data Safety form based on the v1.7.2 codebase. The owner must verify it against any future SDKs or external service changes.

## Data sent off device by the app (Conditional / Opt-In)

| Feature | Data | Purpose | User action | Notes |
| --- | --- | --- | --- | --- |
| Optional Cloud AI (OpenAI, Gemini, Anthropic, Alibaba, NVIDIA) | Up to 20 recent messages, system prompt, media frames, search excerpts | App functionality (generating AI answers) | User explicitly configures provider & selects cloud model | Transmitted directly over HTTPS. API credentials stored in Android Keystore. Provider policies apply. |
| Optional Web Search | Search query text | App functionality (retrieving web citations) | User enables web search | Transmitted over HTTPS. Excerpts cited in response. |
| Optional LM Studio | Conversation turn and instructions | App functionality (local network inference) | User configures LM Studio server | Transmitted to user's server. Private IPv4 HTTP allowed on local network; public HTTP blocked. |
| Model download | Network request metadata (e.g. IP address) | App functionality | User taps download | Hosted by Hugging Face over HTTPS. Third-party host terms apply. |
| AI response report | Reported response text, category, response ID, optional user explanation | Safety, abuse prevention, quality review | User submits report via in-app dialog | Minimal payload sent via HTTPS endpoint or native email. No conversation history or credentials sent. |
| Android speech recognition | Voice audio | Voice input | User taps microphone | Processed by Android platform speech provider; app receives recognized text. |

## Data stored locally on device only

| Data | Location | Sent to developer by default | User Deletion Control |
| --- | --- | --- | --- |
| Chat messages & history | Device private storage (MMKV) | No | Deletable per-chat or all via "Clear chat" |
| Memories & facts | Device private storage (MMKV) | No | Deletable individually or reset in Settings |
| App settings & preferences | Device private storage (MMKV) | No | Reset preference button in Settings |
| Imported document text | Device memory / active chat | No | Cleared with conversation |
| Downloaded model files | Device app files directory | No | Deletable via Model Manager |
| Provider API Keys / Tokens | Android Keystore (AES-256 GCM) | No | Deletable in AI Providers / Settings |

## Console answers to declare

- **Data collection & sharing**: Disclose "Messages", "Photos and Videos" (vision frames), and "Search History" under App Functionality, noting that collection/sharing only occurs when user explicitly opts into third-party cloud services or web search.
- **Data encrypted in transit**: Yes, all app-controlled network calls require HTTPS.
- **Data deletion mechanism**: Yes, users can delete all local data directly in the app.
- **App account system**: No, the app has no user accounts or registration.
- **Advertising**: No, the app contains no advertising SDKs.
- **Analytics**: No, the app contains no analytics SDKs.
- **Target Audience**: Adults (18+) recommended until child-directed review is complete. Android backup is disabled (`android:allowBackup="false"`).
