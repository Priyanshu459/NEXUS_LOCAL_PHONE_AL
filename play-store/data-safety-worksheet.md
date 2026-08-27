# Play Data Safety Worksheet

This is a conservative starting point for the Play Console form. The owner must verify it against the production backend, privacy policy, and any analytics/crash/reporting SDKs added later.

## Data sent off device by the app

| Feature | Data | Purpose | User action | Notes |
| --- | --- | --- | --- | --- |
| Model download | Network request metadata such as IP address may be visible to the model host | App functionality | User taps download | Hosted by third party. Review whether this is disclosed as shared with a service provider or third party. |
| AI response report | Reported AI response, report category, optional explanation, response ID | Safety, abuse prevention, quality review | User confirms report | Only applies after production endpoint is configured. No full conversation is sent. |
| Android speech recognition | Speech/audio may be processed by the selected Android speech provider | Voice input | User taps voice input | The app receives recognized text. The external provider's policy applies. |

## Data stored locally

| Data | Location | Sent to developer by default |
| --- | --- | --- |
| Chat messages | Device storage | No |
| Memories | Device storage | No |
| App settings | Device storage | No |
| Imported file text | Device storage | No |
| Downloaded model files | Device storage | No |

## Console answers to verify

- Data is encrypted in transit for app-controlled network calls: yes, HTTPS required.
- Users can request deletion of submitted reports: owner must implement and publish contact workflow.
- App has no account system: yes, unless added later.
- App has no ads: verify final build.
- App has no analytics SDK: verify final dependency graph before upload.
- App is not child-directed: recommended until a separate child-safety/legal review is complete.

## Do not mark as complete until

- The production reporting backend exists.
- The live privacy policy names report retention and deletion contact.
- Any third-party SDKs added after this audit are included.
- Play Console answers are reviewed by the legal/business owner.
