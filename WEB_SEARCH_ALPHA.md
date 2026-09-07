# Moonlight 1.3.0: web-search alpha

## Implemented locally

- Per-message opt-in search with a separate editable query review; nothing is sent until Send. Web turns off after the message. Attachments, memories and conversation history are not included in the search request.
- Settings for an HTTPS gateway endpoint and individual alpha code. Endpoint persists; code is kept in session memory, never MMKV. No server connection is claimed merely by saving settings.
- Android native HTTPS transport with disabled redirects, connection/read deadlines, cancellation and a 16 KB response bound.
- A maximum of three source excerpts; dynamic truncation fits the existing 1,024-token model context. Source cards contain only sanitized returned HTTPS URLs and survive saved-history reload. Source text is untrusted evidence, and web-assisted responses cannot create memories.
- Search failures preserve the draft for retry or an explicit offline Send. No automatic fallback that could pretend to have searched.
- An authenticated SearXNG gateway with 14 separately generated codes, persisted daily attempt counters, 20 attempts per tester per UTC day, three simultaneous requests overall and one per code. Excess concurrency returns 429. Query and result text are not logged or stored by the gateway.
- An Oracle Linux Podman/Quadlet setup script for a private SearXNG service, gateway and Caddy HTTPS endpoint. Public entry point is planned as `https://search.bodhisync.online/search`.

## Validation and remaining work

115 app/service tests across 17 suites and five gateway tests passed. TypeScript checking and setup-script Bash syntax validation passed. Gateway tests use a controlled upstream, not live search engines.

Oracle SSH access was declined. Server setup, Cloudflare DNS, TLS issuance and real SearXNG requests have **not** been executed or verified. No real-device web-answer quality, thermal or sustained-load test has been performed. Earlier compact-model restrictions and memory checks remain in place.

Follow [server/search/README.md](server/search/README.md) for the exact DNS record, upload, installation, verification and tester-code steps. The installer stops on an existing `/opt/moonlight-search` directory to avoid overwriting credentials.

Search API reference: https://docs.searxng.org/dev/search_api.html

Container reference: https://docs.searxng.org/admin/installation-docker.html
