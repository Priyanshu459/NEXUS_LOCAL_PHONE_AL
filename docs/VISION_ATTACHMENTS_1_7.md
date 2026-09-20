# Moonlight 1.7 — vision attachments

The previous file picker replaced image bytes with a text-only-file warning. This version sends image content blocks to compatible vision models instead.

## Using it

1. Load LFM2.5-VL (or another supported vision model) in LM Studio, including its matching vision projector and a compatible runtime. Connect Moonlight and choose that model from Chat → Computer. For cloud use, choose a vision-capable model from the connected provider.
2. Tap the attachment button and choose an image or short video. Wait for preparation and inspect the thumbnail/name.
3. Add your question and send. Confirm transmission to the selected provider.
4. Reattach media for follow-up questions or retries: history keeps the filename/question and response, not the pixels.

## Supported input and boundaries

- Android-supported images: maximum 16 MiB source, 40 megapixels decoded dimensions, sampled to at most 1024 pixels on the longest edge. JPEG orientation is normalized; conversion strips original metadata. Each resulting JPEG is limited to 256 KiB. Unsupported/corrupt media fails visibly.
- Videos: Android 8.1+, maximum 64 MiB and 60 seconds. Four frames spanning the clip are extracted at a maximum 768-pixel dimension, with timestamps. No audio or continuous-motion understanding is promised. A model/runtime must support multiple images to accept these frames.
- Media is prepared on a background worker. Temporary copies are deleted after processing; an interrupted process can leave cache files until Android clears them. No broad photo, storage or camera permission was added.
- OpenAI-compatible endpoints (LM Studio, NVIDIA, Alibaba and custom servers) use image_url blocks; OpenAI Responses uses input_image; Anthropic uses base64 image sources; Gemini uses inlineData. Support for the wire format does not establish that every individual model accepts images.
- Text-only local phone models remain text-only. The app asks the user to select a vision model and preserves the draft. A provider rejection can explain that the model/runtime/projector is incompatible. A server which silently ignores images cannot be reliably detected by the client.
- Text prompt limits remain; native chat request size has a bounded 1.5 MiB ceiling to accommodate resized media. HTTPS, explicit private HTTP opt-in, secret storage and request deadlines remain unchanged.

## Generation is a separate capability

LFM2.5-VL is an image-text-to-text model. It analyses visual input; it does not generate new image or video files. LM Studio's reviewed standard endpoints do not establish a general image/video generation service. This update does not add a fake generation button or execute arbitrary model-suggested tools. A real generator backend/plugin with a documented API must be identified before generation can be integrated.

References reviewed September 19, 2026:
- https://huggingface.co/LiquidAI/LFM2.5-VL-450M
- https://lmstudio.ai/docs/developer/openai-compat/chat-completions
- https://lmstudio.ai/docs/developer/rest
- https://platform.claude.com/docs/en/build-with-claude/vision
- https://ai.google.dev/api/generate-content

## Validation scope

190 Jest tests across 26 suites passed, including all provider payload formats, video timestamps, oversized/invalid media rejection, and attachment consent/history persistence. TypeScript passed. These tests mock Android media preparation and provider responses; they do not prove physical-device decoding or successful inference with a live account/LM Studio runtime. Native APK compilation and final signature/package checks are recorded in releases/vision-build.log. Phone photo orientation, codecs, thermal behavior and end-to-end vision accuracy still require device testing.

The signed preview APK was built successfully: releases/Moonlight-1.7.0-Glass-Preview-arm64.apk, version code 19. SHA256: 585E540D6884366EFB0E613A26F71CDEC0FB4A477BB7E7889107F166AE52ED12. Browser checks passed chat, model/provider navigation, night mode and small/landscape layouts without page errors. Scoped vision-service lint passed. Prior Play publication blockers in the September 17 review remain; this is a phone-test preview.
