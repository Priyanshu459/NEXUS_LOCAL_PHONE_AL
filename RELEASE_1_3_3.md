# Moonlight 1.3.3 preview

- Restore the microphone drawing using an explicit icon prop, independent of its accessibility label.
- Constrain the message list to available space, prevent the composer shrinking, and scroll to the latest response after list/composer layout changes, including returning from speech recognition.
- Replace the query dialog with a persistent Web switch. While on, sending a typed or spoken message searches using its first 400 characters and supplies the source excerpts to the local model before answering. No extra query entry is required.
- Keep alpha endpoint/key setup, HTTPS restrictions and session-only credentials. Update the in-app instructions and privacy text for automatic queries.

TypeScript and 118 tests across 18 suites passed. Tests cover speech triggering search, no request when merely enabling Web, and Web remaining enabled after an answer. Actual speech UI resizing requires phone verification.

Version code 9. Preview package and signing only; not a Play production upload. Retains compact-model memory checks from prior builds.
