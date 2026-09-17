# Moonlight performance, security and publication review

Reviewed September 17, 2026. This is an engineering and license inventory review, not legal clearance, a security certification, or a guarantee of Play acceptance. The owner states the app generates no revenue. The LFM threshold concerns the relevant legal entity, not only one app's revenue.

## Changes implemented

- Coalesced local token rendering into 80 ms batches. Text is accumulated immediately and the complete response is persisted at completion/stop; pending display callbacks are disposed. A regression sends 100 tokens in one burst and verifies a single update containing all 100 characters. This measures update-count reduction, not physical-phone speed or battery improvement.
- Reduced the chat list's initial/batch/window rendering budget, retaining safe scrolling and the existing model context lifecycle. No model memory limits were relaxed.
- Added native overall provider deadlines (30 seconds for model discovery; 75 for chat), cancellation/disconnection, synchronized admission of at most two requests, and bounded request identifiers. Network cancellation timing still needs Android slow-server testing.
- Native endpoint validation now rejects loopback/metadata destinations over HTTPS too, invalid ports, control characters and ambiguous backslashes. User-approved private LM Studio HTTP remains available; it is not encrypted by Moonlight.
- Applied compatible dependency updates in package-lock.json. The initial production npm audit reported 11 affected packages (including build-time transitive tooling). The subsequent full npm audit reports zero known advisories. Reports: releases/security-audit-production.json and releases/security-audit-after.json. This does not scan Maven artifacts, native C/C++ code, or discover unknown vulnerabilities.
- Added Settings → About & help → Software licenses. It searches/paginates notices, displaying one expanded text at a time. The generated inventory covers 582 installed production npm packages, including associated tooling, not an exact APK bill of materials.

## What is free, and under which conditions?

| Component | Finding |
| --- | --- |
| React, React Native, navigation, llama.rn, React Native MMKV/Nitro | Installed package metadata declares MIT. Other transitive packages declare BSD, ISC, Apache, Python, CC-BY and similar licenses. No unknown declared license remains in this npm inventory. These are permission grants with obligations, not public-domain assets. |
| LFM2 / LFM2.5 downloads | LFM Open License 1.0, not plain Apache 2.0. No app revenue is consistent with being below the commercial revenue threshold, provided the legal entity also qualifies. Retain model notices and license terms. Seek a commercial license if the applicable revenue threshold is reached/exceeded rather than relying on a free-app label. |
| Other user-selected models | Each model's own license and acceptable-use terms apply. Existing downloaded legacy models are retained. Moonlight's MIT license does not relicense their weights. |
| LM Studio | Free to use at home/work under its own terms; not an open-source redistribution grant. Moonlight uses the published server API and does not bundle LM Studio. Do not sell a hosted LM Studio service without reviewing those terms. |
| Tailscale | Optional separately installed service. A free Personal plan is not blanket permission for business operation; each user's applicable plan/terms matter. |
| Cloud providers and provider web search | Separate account/service terms and usage quotas apply. Users' API keys can incur token/tool fees even if Moonlight earns nothing. Never promise all connected providers are permanently free. |
| Branding, backgrounds and fonts | Inspected app assets contain the Moonlight SVG/PNG identity and two backgrounds; no bundled font files were found. This inventory cannot establish ownership or trademark clearance for every asset. Keep creation/source records; avoid Apple logos, proprietary fonts and affiliation claims. |

Model reference: [Liquid AI license](https://www.liquid.ai/lfm-license). LM Studio references: [free at work](https://lmstudio.ai/blog/free-for-work), [application terms](https://lmstudio.ai/app-terms). Service references: [Tailscale pricing](https://tailscale.com/pricing), [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing), [Anthropic billing](https://support.anthropic.com/en/articles/8114526-how-will-i-be-billed).

## Publication blockers and unfinished verification

1. **Response reporting is not operational.** src/config/compliance.ts has AI_REPORT_ENDPOINT empty. Existing UI/service code is not a functioning report channel until a real, abuse-protected endpoint and retention workflow are configured and tested. Google requires in-app reporting/flagging for covered generative-AI apps. A local button or external email alone should not be treated as completing this requirement. See [Google AI-generated content policy](https://support.google.com/googleplay/android-developer/answer/14094294?hl=en).
2. **Complete the notice audit.** Several installed packages omit a standalone license/NOTICE file. SOFTWARE_LICENSE_INVENTORY.json records hasNotice=false instead of fabricating copyright text. Retrieve the correct version's upstream notices where needed. Separately inventory the resolved Android/Maven artifacts and bundled C/C++ dependencies; npm metadata alone cannot clear these. Re-run tools/build-license-notices.cjs after dependency changes.
3. **Verify the public privacy policy and Play Data safety answers.** Cloud prompts/attachments, provider search, Hugging Face download requests and device speech services can involve third parties. Chats/memories use application-private MMKV without additional app-level encryption; credentials use Android Keystore-backed AES-GCM. HTTP opt-in means an unqualified claim that every transmission is encrypted would be inaccurate. Check [Google User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311).
4. **Confirm release ownership and signing.** The delivered artifact is the separately identified preview package, not a production Play update. Verify production package, upload certificate and highest version code in Play Console. Complete target-audience/content-rating decisions, content-safety handling and testing before publication.
5. **Device validation remains necessary.** No physical-phone battery, temperature, memory-pressure, malicious GGUF fuzzing, rooted-device extraction, live provider or remote-server penetration test was completed here. A compromised/rooted phone can bypass app protections. Signed APK and unit checks do not establish hacking-proof behavior.

## Validation

180 Jest tests across 25 suites and TypeScript passed after the dependency changes. The two privacy tests also passed after correcting the credential/storage disclosure. Scoped lint passed. Existing navigation/model lifecycle checks remain green. Six native endpoint tests passed. Native test and APK build evidence is recorded in releases/hardening-native-tests.log and releases/hardening-build.log. Browser checks passed software-license search/text, connection status, five themes and small-screen layout, with no page errors or overflow. Browser UI evidence includes output/glass-preview/software-notices.png. The configured public privacy URL could not be verified through the web tool; this is not proof the website is down.

Signed preview APK: releases/Moonlight-1.6.2-Glass-Preview-arm64.apk, version code 18. SHA256 B45E08F74B7D861A3A61C281261E8BEBFBCCC85C1FEE0AC4C412A6F5AAE4922B. It is for phone testing; it is not a production Play upload or legal/security certification.

The practical conclusion is that free publication is plausible under the applicable licenses, but this review does not clear the present build for public Play release. Fix the reporting and notice/disclosure gaps first; no-revenue status does not waive them.
