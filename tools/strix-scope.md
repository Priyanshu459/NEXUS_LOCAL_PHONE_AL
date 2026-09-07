# Moonlight Android security assessment

Assess only the supplied source snapshot of the owner's React Native Android app. This is an offline local-LLM mobile application, not a web backend. Browser UI previews use stubs and do not represent native runtime security.

Do not probe external domains, model hosting providers, websites, email addresses, or other systems named in the source. Use local fixtures and mocks to validate network-related logic. Do not access host files outside the supplied snapshot or search for credentials. No production user data is supplied. Do not publish or upload the project to a code hosting service.

Focus on model URL validation and redirects, download integrity and partial-file handling, path traversal, imported document limits and URI permissions, exported Android components, backup and network configuration, conversation/memory privacy, report transmission and consent, untrusted generated text rendering, and dependencies reachable from these surfaces.

Return a report with file and line references, attack preconditions, reproducible evidence and remediation for each validated finding. Clearly distinguish confirmed issues from hypotheses, hardening suggestions and areas that require a real Android device. Do not claim a dynamic APK test or a clean bill of health based on source inspection. Do not change application source; place proof-of-concept tests separately within the snapshot.

Native binaries, signing keys, build caches and private release configuration are intentionally excluded. Missing excluded build inputs are a testing limitation, not an application vulnerability.
