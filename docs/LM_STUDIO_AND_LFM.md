# Moonlight 1.6: computer connections and phone models

## LM Studio

Settings → LM Studio saves a dedicated computer connection, separately from cloud providers. Start the API server in LM Studio, enable Serve on Local Network, and use its reachable server address. Enable server authentication and paste its token when configured. Models are discovered through `/v1/models`; chat uses `/v1/chat/completions`. Select them in the chat model sheet's Computer tab.

Direct Moonlight-to-LM-Link pairing is not implemented: no public Android pairing integration was verified. LM Studio documents that its server API can route a request to models on its own LM Link. Moonlight connects to that API server over a reachable network address; it does not join LM Link's private network. The computer must be awake and reachable. A VPN must be configured independently if needed.

HTTP requires an explicit saved opt-in and a private IPv4 literal (RFC1918 or 100.64/10 for a separately configured VPN). Public HTTP, localhost, link-local addresses, HTTP hostnames, URL credentials, query strings, fragments and redirects are rejected. Cloud-provider requests remain HTTPS-only. Android's application cleartext flag is enabled to make opted-in LAN HTTP possible; the restriction is enforced by the native ProviderEndpointPolicy, not an Android domain whitelist. HTTP tokens and prompts are unencrypted unless protected by the user's network/VPN. HTTPS uses normal certificate validation, including for private servers.

Keys remain in the native encrypted vault; provider metadata contains no key. Editing a saved connection preserves its encrypted token when the server address stays the same. Changing the address requires re-entering its token; credentials are never silently copied to another server. Refreshing without edits reuses the vault entry.

Official references:
- https://lmstudio.ai/docs/developer/core/server/serve-on-network
- https://lmstudio.ai/docs/developer/core/lmlink
- https://lmstudio.ai/docs/lmlink/basics/faq

## Remote setup added in 1.6.1

Settings → LM Studio now offers Same Wi-Fi and From anywhere, each with expandable steps. For remote use, install Tailscale on both devices and join the same private network. Start an authenticated LM Studio server on the computer's localhost port 1234. Run `tailscale serve --bg http://127.0.0.1:1234`, follow its HTTPS setup instructions, then enter the printed HTTPS URL and LM Studio token in Moonlight. Test with phone Wi-Fi off and Tailscale still connected. The computer must stay awake with the server, internet and Tailscale running. This is separately configured private access, not direct LM Link pairing. Do not use Funnel or publicly forward an unauthenticated server port.

Connection progress and errors remain above the form. Empty model discovery is explicitly reported. DNS, refused connection, timeout, certificate and invalid JSON errors have actionable messages. Localhost and LM Link website addresses are rejected. Remote mode requires an authenticated HTTPS connection.

Reference: https://tailscale.com/docs/features/tailscale-serve

## Phone catalog

Only these official Liquid AI Q4_K_M files are offered as new catalog downloads:

| Model | Exact bytes | Pinned publisher revision |
|---|---:|---|
| LFM2 350M | 229309376 | 8fdc9d526b7ed346b19257551b05816c7912ecc2 |
| LFM2 700M | 468624320 | fd39e80d7a5ac61494ffff577e61bbbfddbd0d02 |
| LFM2.5 1.2B Instruct | 730895168 | 6767265158422fb8a19c62ceb45f16f05363615b |

Official repository metadata, license files, HTTP download availability, GGUF magic and total sizes were checked September 14, 2026. Full-file SHA-256 values are in src/constants/models.ts and are checked by the downloader. The installed llama.rn runtime has LFM2 architecture code supporting these model sizes. This is source compatibility evidence, not a physical-phone inference benchmark.

Catalog visibility uses the existing loader's 64-bit, minimum 4 GiB total RAM, 1.3 GiB file cap and file-size-plus-1.5-GiB available-memory reserve. Memory is rechecked at download and load. The loader still uses serialized loads, 1024 context and two threads. Downloading on the Models screen does not automatically switch the active model. Previous downloaded models/settings are preserved; new installations default to the smallest LFM. Chat setup does not offer a download when the memory check fails.

## UI and verification

Glass settings groups, line icons, theme previews, persistent Reduce Motion, computer connection form, and Phone / Computer / Cloud picker are implemented. Existing Paper, Mono, Midnight and both Glass modes remain available. Privacy copy explains the computer connection. Google Play update notice remains implemented.

Run `npx jest --runInBand`, `npx tsc --noEmit`, `:app:testReleaseUnitTest -PmoonlightPreview=true`, and the two tools/check-*ui preview scripts. Native tests cover endpoint restrictions; JavaScript tests cover vault metadata separation, discovery/chat request dispatch, URL validation and device filtering. Browser tests use real screens with unavailable native operations; they do not prove remote inference.

Live LM Studio chat, physical Android LFM inference, real Google Play update availability, and direct LM Link pairing have not been verified. Cloud image/video generation and vision adapters remain outside this implementation; do not claim the full media concept is available.


