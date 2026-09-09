# Moonlight 1.3.4 preview

Repairs the invalid Llama 1B repository revision and migrates the obsolete saved address. Verified both available model URLs with HTTP HEAD: 200 and expected sizes. Llama is pinned to revision 067b946cf014b7c697f3654f621d577a3e3afd1c and verified against its published SHA-256 metadata.

Search credentials now persist as AES-GCM ciphertext with an Android Keystore key. Native operations run on a serial background executor. The endpoint and bearer key are encrypted together; restoration happens before enabling search or sending requests. Saving UI waits for success. Disconnect and HTTP 401 remove the saved credential. No plaintext bearer key is stored in MMKV. App backup remains disabled.

Users upgrading from the session-only implementation must enter and save the key once. A screenshot of the old not-activated message proves no usable local connection was present, not why it disappeared; restart loss was a known limitation addressed here. Server authorization is unchanged.

Includes the microphone, chat layout and automatic Web-switch changes from 1.3.3. Large-model safety restrictions remain.

Physical-device verification still required for encrypted save/restart/restore, speech UI resizing, and a full Llama download/load. Header checks are not a full file download. This is a preview APK, not a production Play upload.
