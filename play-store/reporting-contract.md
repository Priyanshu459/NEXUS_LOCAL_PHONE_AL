# AI Reporting Endpoint Contract

The app-side reporting flow is implemented, but the production endpoint is intentionally blank until the owner supplies a real HTTPS endpoint in `src/config/compliance.ts`.

## Endpoint requirements

- HTTPS only.
- Accept `POST` requests with `Content-Type: application/json`.
- Return any 2xx status for success.
- Return non-2xx status with no sensitive diagnostic details for failure.
- Do not require a client secret embedded in the app.
- Apply server-side abuse protection, rate limits, audit logging, and access controls.

## Payload

```json
{
  "schemaVersion": 1,
  "responseId": "assistant-123",
  "reportedResponse": "The exact assistant response selected by the user.",
  "category": "inaccurate",
  "explanation": "Optional user explanation.",
  "conversationIncluded": false
}
```

## Categories

- `inaccurate`
- `inappropriate`
- `unsafe`
- `privacy`
- `copyright`
- `other`

## Deliberately excluded

- Full conversation history.
- User memories.
- Imported document contents unless those contents are part of the selected assistant response.
- Device identifiers.
- Model files or model paths.
- Backend credentials.

## Retention and review

Owner action required before launch:

- Define report retention period.
- Define who can access reports.
- Define user deletion and appeal workflow.
- Document moderation/review escalation.
- Update the public privacy policy with the same retention and contact details.
