# Moonlight current continuation checkpoint — 2026-09-15

Continue in C:\Dev\moonligth_ai_nexus\NEXUS_LOCAL_PHONE_AL. Preserve all working-tree changes. This checkpoint supersedes older plans in CONTINUE_GLASS_BUILD.md. Read current source and docs/LM_STUDIO_AND_LFM.md first.

Latest user issue: LM Studio Show models appeared to do nothing and did not list their loaded models. Their server address/network and live server error are still unknown. Do not claim their actual connection has been tested. No API token was requested or exposed.

1.6.1 implements a fixed visible status above the scrollable LM Studio form, busy indicator, explicit empty-catalog result, native network error classification, and an actionable invalid JSON error. Native encrypted token preservation is allowed only for the same LM Studio endpoint; a changed address requires token re-entry. Remote mode requires authenticated HTTPS. Localhost and LM Link website/invitation addresses are rejected.

Settings → LM Studio offers Same Wi-Fi and From anywhere, with expandable step-by-step guides. The latter documents separately configured Tailscale on computer and Android plus `tailscale serve --bg http://127.0.0.1:1234`. The user must configure it; Moonlight does not join Tailscale or LM Link itself. Computer must be awake with authenticated LM Studio running. No public port forwarding/Funnel recommended. HTTP remains opt-in private literal IPv4 only; cloud providers stay HTTPS-only and native redirects remain disabled.

Built and signature verified: releases/Moonlight-1.6.1-Glass-Preview-arm64.apk. Package com.moonknightstudio.moonlightai.preview, versionCode 17, versionName 1.6.1-preview, minSDK24 target36 arm64. SHA256 CEACBA14B0A5461BA0E59AA44514A47D061A8C6B3235BCE80C28D783171F9592. This is a preview build, not a Play upload; actual Play identity/upload credentials remain unconfirmed. Never print signing.json or keys. Build with tools/build-preview.ps1 -ReuseNativeBinaries when C++ unchanged, SDK access requires approval.

Validation: 178 JavaScript tests pass (24 suites), TypeScript and scoped whitespace check pass. First concurrent test run hit a 5-second timeout; rerun with 20-second timeout passed. Real-screen browser check passed fixed status visibility, remote guide, five themes and small-screen layout with no errors/overflow. Native endpoint tests passed; see releases/lm-remote-native-tests.log. Build log releases/lm-remote-build.log. No physical Android or live LM Studio inference verified.

Preserve phone safety: Realme 11 Pro previously froze with large Qwen. Keep 1.3 GiB model cap, 4 GiB total RAM minimum, file+1.5 GiB available reserve, serialized loads, two threads and 1024 context. New downloads are only official pinned LFM2 350M, LFM2 700M, LFM2.5 1.2B Q4_K_M. Existing installed models preserved. Full LFM phone inference has not been verified.

Other implemented scope: glass settings, Phone/Computer/Cloud model picker, reduced motion, normal clipboard keyboard, chat scrolling, provider adapters, native OpenAI/Anthropic web tools, Play foreground update notice. Preserve exact NVIDIA host forcing OpenAI format for old saved Gemini configurations. Removed old SearXNG Web UI, Agent and Gmail per user request; do not reintroduce. Image/video generation and vision remain unimplemented approved concepts, not released capabilities. Brand remains approved transparent crescent.

Preview: node tools/build-glass-preview.cjs; serve output/glass-preview on localhost4176. Browser checks tools/check-lm-ui.cjs and tools/check-glass-preview.cjs require local browser permissions. Screenshots in output/glass-preview. Preview has no native connection functionality; use it only for UI checks.

