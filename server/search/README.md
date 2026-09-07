# Moonlight closed-alpha search

This is a dependency-free Node 22 gateway for a private SearXNG instance. The Android client sends an explicitly reviewed query, not a conversation, memory or attachment. Search is off by default and resets after each message. The model sees bounded excerpts; cited source buttons are built only from returned URLs, never model-supplied URLs.

## Oracle setup

Direct SSH access was declined in this task. These server changes have not been run. Confirm the instance is running and its public IP is still `137.23.47.196` after the boot-volume reset.

1. In Cloudflare DNS for `bodhisync.online`, add **A / search / 137.23.47.196 / DNS only**. Do not create an AAAA record unless IPv6 is configured. This gives `search.bodhisync.online`.
2. In the Oracle instance subnet's security list or NSG, permit inbound TCP **80 and 443** for HTTP certificate validation and HTTPS. Keep SSH 22 restricted to your administration IP where possible. Do not expose 8080 or 8787.
3. From Windows PowerShell, upload this folder:

```powershell
scp -i "C:\Users\priya\Downloads\ssh-key-2026-09-06.key" -r "C:\Dev\moonligth_ai_nexus\NEXUS_LOCAL_PHONE_AL\server\search" opc@137.23.47.196:~/moonlight-search-setup
```

4. In the Oracle SSH session, run:

```bash
sudo bash ~/moonlight-search-setup/setup-oracle.sh search.bodhisync.online
```

The script installs Podman, pulls official ARM-compatible images, generates 14 unique codes, builds the gateway, and creates systemd Quadlet services with restart policies. It stops if `/opt/moonlight-search` already exists. SearXNG and the gateway share a pod with Caddy, but only ports 80/443 are published. SearXNG's own limiter is disabled only because it is private behind gateway authentication and limits. This is a proposed deployment script, not a server-tested installation.

## Check before inviting testers

```bash
sudo systemctl --no-pager --full status moonlight-searxng moonlight-gateway moonlight-caddy
sudo journalctl -u moonlight-caddy -n 30 --no-pager
curl -i https://search.bodhisync.online/search -H 'Content-Type: application/json' -d '{"query":"test"}'
```

Expect **401 Unauthorized** from the last command. Then test one real query with a tester code entered interactively (avoid commands containing literal secrets):

```bash
read -rs -p 'Tester code: ' SEARCH_CODE; echo
printf 'header = "Authorization: Bearer %s"\n' "$SEARCH_CODE" | curl --config - --fail-with-body https://search.bodhisync.online/search -H 'Content-Type: application/json' -d '{"query":"SearXNG official documentation"}'
unset SEARCH_CODE
```

An empty result is possible when engines block the server IP. Investigate engine errors rather than claiming successful search. The health endpoint checks the gateway process only, not search-engine availability.

## Tester access

The administrator can read `/opt/moonlight-search/private/tester-codes.json` with sudo. Never paste that file into chat or commit it. Share each tester only their own code privately. Only SHA-256 code hashes are mounted into the gateway. Remove a hash from `/opt/moonlight-search/data/token-hashes.json` and restart `moonlight-gateway` to revoke a code.

In Android **Settings → Web search**, enter `https://search.bodhisync.online/search` and your code. Codes stay only in app memory and must be re-entered after restarting. The endpoint is persisted. The app requires an updated Android build with the bounded HTTPS transport; it rejects redirects and does not support insecure HTTP.

## Limits and privacy

- 20 attempts per code per UTC day, persisted across gateway restarts. Failed upstream attempts count.
- One active request per code, three across the gateway. Additional requests receive 429 rather than waiting in an unbounded queue. This intentionally replaces the earlier queue proposal.
- Query: 400 characters, incoming body: 2 KB, upstream body: 512 KB, up to three excerpts of 240 characters. App transport caps responses at 16 KB. No result-page crawler or URL-fetch endpoint.
- Fixed operator-configured SearXNG destination; caller cannot change it. No shared admin secret embedded in the APK.
- Quota storage contains token hashes and counts, no queries or results. Default gateway logging contains no request content. Review proxy, provider and engine logging independently. Search engine requests still leave your server.
- Retrieved text is untrusted. The prompt tells the model to ignore instructions in it; memory writes are disabled for web-assisted turns. This reduces risk but does not guarantee the model resists all prompt injection or makes correct citations.
- Context remains at 1,024 tokens. Evidence is shortened and sources removed to fit, with at least one retained; otherwise generation fails clearly. Saved sources correspond to evidence actually passed to the model. No real-device web-answer quality or thermal testing has been performed.

Run gateway tests with `node --test server/search/test.mjs` from the repository root. Tests use a controlled SearXNG substitute and do not verify live engine availability. Use a single gateway process; quotas and concurrency are not coordinated across replicas.
