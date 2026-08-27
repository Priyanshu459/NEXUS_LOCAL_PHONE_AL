declare const __dirname: string;

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

describe('Android release compliance configuration', () => {
  it('keeps dangerous microphone and legacy storage permissions out of the app manifest', () => {
    const manifest = fs.readFileSync(
      path.join(repoRoot, 'android/app/src/main/AndroidManifest.xml'),
      'utf8',
    );
    const releaseManifest = fs.readFileSync(
      path.join(repoRoot, 'android/app/src/release/AndroidManifest.xml'),
      'utf8',
    );

    expect(manifest).toContain('android.permission.INTERNET');
    expect(manifest).not.toContain('android.permission.RECORD_AUDIO');
    expect(releaseManifest).toContain('android.permission.RECORD_AUDIO');
    expect(releaseManifest).toContain(
      'android.permission.READ_EXTERNAL_STORAGE',
    );
    expect(releaseManifest).toContain(
      'android.permission.WRITE_EXTERNAL_STORAGE',
    );
    expect(releaseManifest).toContain('tools:node="remove"');
    expect(manifest).not.toContain(
      'android.permission.MANAGE_EXTERNAL_STORAGE',
    );
  });

  it('does not request microphone permission before launching external speech recognition', () => {
    const chatScreen = fs.readFileSync(
      path.join(repoRoot, 'src/screens/ChatScreen.tsx'),
      'utf8',
    );

    expect(chatScreen).not.toContain('PermissionsAndroid');
    expect(chatScreen).not.toContain('request(');
    expect(chatScreen).not.toContain('RECORD_AUDIO');
    expect(chatScreen).toContain('NativeModules.DeviceControl');
    expect(chatScreen).toContain('deviceControl.startSpeechRecognition');
  });

  it('registers the native Android device-control bridge under the production package', () => {
    const application = fs.readFileSync(
      path.join(
        repoRoot,
        'android/app/src/main/java/com/moonknightstudio/moonlightai/MainApplication.kt',
      ),
      'utf8',
    );
    const module = fs.readFileSync(
      path.join(
        repoRoot,
        'android/app/src/main/java/com/moonknightstudio/moonlightai/DeviceControlModule.kt',
      ),
      'utf8',
    );

    expect(application).toContain('add(DeviceControlPackage())');
    expect(module).toContain('RecognizerIntent.ACTION_RECOGNIZE_SPEECH');
    expect(module).toContain('resolveActivity');
    expect(module).toContain('REQUEST_IN_PROGRESS');
  });

  it('blocks release builds unless an explicit upload signing key is configured', () => {
    const buildGradle = fs.readFileSync(
      path.join(repoRoot, 'android/app/build.gradle'),
      'utf8',
    );

    expect(buildGradle).toContain('MOONLIGHT_UPLOAD_STORE_FILE');
    expect(buildGradle).toContain('Production signing is required');
    expect(buildGradle).toContain(
      'Release artifacts are never signed with the debug key',
    );
    expect(buildGradle).toContain('usesCleartextTraffic: "false"');
    expect(buildGradle).toContain('debuggable false');
    expect(buildGradle).toContain('signingConfig null');
    expect(buildGradle).not.toContain(
      'release {\n            signingConfig signingConfigs.debug',
    );
  });
});
