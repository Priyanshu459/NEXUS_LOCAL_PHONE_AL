# Android Release Signing

The repository is configured so release builds require an explicit upload key. Release builds must not use the Android debug key.

## Generate upload key

Run this outside the repository and store the keystore in a secure location:

```powershell
keytool -genkeypair -v -keystore C:\secure\moonlight-upload.jks -alias moonlight-upload -keyalg RSA -keysize 4096 -validity 10000
```

Recommended handling:

- Use Play App Signing.
- Keep the upload key separate from the app signing key.
- Store the keystore in an encrypted password manager or secure secrets vault.
- Keep at least two offline backups.
- Do not commit the keystore, passwords, certificates, or generated `*.jks` files.
- Test restore from backup before the first production release.

## Export upload certificate for Play Console

```powershell
keytool -exportcert -rfc -keystore C:\secure\moonlight-upload.jks -alias moonlight-upload -file C:\secure\moonlight-upload-cert.pem
```

## Verify certificate

```powershell
keytool -list -v -keystore C:\secure\moonlight-upload.jks -alias moonlight-upload
```

Record the SHA-256 fingerprint in release evidence.

## Build with environment variables

Set these only in the local shell or CI secrets, never in source control:

```powershell
$env:MOONLIGHT_UPLOAD_STORE_FILE = "C:\secure\moonlight-upload.jks"
$env:MOONLIGHT_UPLOAD_STORE_PASSWORD = "[store password]"
$env:MOONLIGHT_UPLOAD_KEY_ALIAS = "moonlight-upload"
$env:MOONLIGHT_UPLOAD_KEY_PASSWORD = "[key password]"
cd android
.\gradlew.bat :app:bundleRelease
```

If any variable is missing, the Gradle build intentionally fails before producing a release artifact.
