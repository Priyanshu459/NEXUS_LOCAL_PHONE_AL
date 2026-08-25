package com.localllmapp;

import android.app.Activity;
import android.content.Context;
import android.content.ClipboardManager;
import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import android.database.Cursor;
import android.provider.OpenableColumns;
import android.speech.RecognizerIntent;
import java.io.InputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

public class DeviceControlModule extends ReactContextBaseJavaModule {

    private static final int SPEECH_REQUEST_CODE = 100;
    private static final int FILE_REQUEST_CODE = 101;
    private static final long MAX_TEXT_FILE_BYTES = 512 * 1024;
    private Promise speechPromise;
    private Promise filePromise;

    private final ActivityEventListener activityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
            if (requestCode == SPEECH_REQUEST_CODE && speechPromise != null) {
                if (resultCode == Activity.RESULT_OK && data != null) {
                    ArrayList<String> results = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
                    if (results != null && !results.isEmpty()) {
                        speechPromise.resolve(results.get(0));
                    } else {
                        speechPromise.reject("NO_RESULT", "No speech recognized");
                    }
                } else {
                    speechPromise.reject("CANCELLED", "Speech recognition cancelled");
                }
                speechPromise = null;
            } else if (requestCode == FILE_REQUEST_CODE && filePromise != null) {
                if (resultCode == Activity.RESULT_OK && data != null) {
                    Uri uri = data.getData();
                    if (uri != null) {
                        try {
                            String displayName = "unknown.txt";
                            long sizeBytes = 0;
                            try (Cursor cursor = activity.getContentResolver().query(uri, null, null, null, null)) {
                                if (cursor != null && cursor.moveToFirst()) {
                                    int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                                    int sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE);
                                    if (nameIndex != -1) {
                                        String queriedName = cursor.getString(nameIndex);
                                        if (queriedName != null && !queriedName.trim().isEmpty()) {
                                            displayName = queriedName;
                                        }
                                    }
                                    if (sizeIndex != -1 && !cursor.isNull(sizeIndex)) {
                                        sizeBytes = cursor.getLong(sizeIndex);
                                    }
                                }
                            }

                            String sizeStr = sizeBytes > 1024 ? (sizeBytes / 1024) + " KB" : sizeBytes + " B";
                            String lowerName = displayName.toLowerCase();
                            String contentStr;

                            if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || lowerName.endsWith(".png") || lowerName.endsWith(".gif") || lowerName.endsWith(".webp") || lowerName.endsWith(".bmp") || lowerName.endsWith(".pdf") || lowerName.endsWith(".zip")) {
                                contentStr = "[Attached File: " + displayName + " (" + sizeStr + ")]\nNote: This is an image or binary document. Local text-only GGUF models cannot visually inspect image pixels directly. If there is text in this image/document you would like summarized or analyzed, please copy or type the relevant text directly into the chat.";
                            } else if (sizeBytes > MAX_TEXT_FILE_BYTES) {
                                contentStr = "[Attached File: " + displayName + " (" + sizeStr + ")]\nThis text file is larger than the 512 KB attachment limit. Please paste a smaller excerpt into chat.";
                            } else {
                                StringBuilder sb = new StringBuilder();
                                try (InputStream is = activity.getContentResolver().openInputStream(uri)) {
                                    if (is == null) {
                                        throw new IllegalStateException("Unable to open selected file");
                                    }
                                    BufferedReader reader = new BufferedReader(new InputStreamReader(is, "UTF-8"));
                                    String line;
                                    int lineCount = 0;
                                    int charCount = 0;
                                    while ((line = reader.readLine()) != null && lineCount < 2000 && charCount < MAX_TEXT_FILE_BYTES) {
                                        String cleanLine = line.replaceAll("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]", "");
                                        sb.append(cleanLine).append("\n");
                                        charCount += cleanLine.length() + 1;
                                        lineCount++;
                                    }
                                }
                                contentStr = sb.toString();
                            }

                            WritableMap map = Arguments.createMap();
                            map.putString("name", displayName);
                            map.putString("size", sizeStr);
                            map.putString("content", contentStr);
                            map.putString("uri", uri.toString());
                            filePromise.resolve(map);
                        } catch (Exception e) {
                            filePromise.reject("READ_ERROR", "Failed to read selected file: " + e.getMessage());
                        }
                    } else {
                        filePromise.reject("NO_URI", "No file selected");
                    }
                } else {
                    filePromise.reject("CANCELLED", "File selection cancelled");
                }
                filePromise = null;
            }
        }
    };

    public DeviceControlModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(activityEventListener);
    }

    @Override
    public String getName() {
        return "DeviceControl";
    }

    @ReactMethod
    public void startSpeechRecognition(Promise promise) {
        Activity currentActivity = getCurrentActivity();
        if (currentActivity == null) {
            promise.reject("NO_ACTIVITY", "No activity available");
            return;
        }
        if (speechPromise != null) {
            promise.reject("REQUEST_IN_PROGRESS", "Speech recognition is already active");
            return;
        }
        this.speechPromise = promise;
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US");
        intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "Speak to Moonlight...");
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        try {
            currentActivity.startActivityForResult(intent, SPEECH_REQUEST_CODE);
        } catch (Exception e) {
            this.speechPromise = null;
            promise.reject("SPEECH_ERROR", "Could not launch speech recognition: " + e.getMessage());
        }
    }

    @ReactMethod
    public void pickFile(Promise promise) {
        Activity currentActivity = getCurrentActivity();
        if (currentActivity == null) {
            promise.reject("NO_ACTIVITY", "No activity available");
            return;
        }
        if (filePromise != null) {
            promise.reject("REQUEST_IN_PROGRESS", "File picker is already active");
            return;
        }
        this.filePromise = promise;
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("*/*");
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        try {
            currentActivity.startActivityForResult(Intent.createChooser(intent, "Select File for Moonlight AI"), FILE_REQUEST_CODE);
        } catch (Exception e) {
            promise.reject("PICKER_ERROR", "Could not launch file picker: " + e.getMessage());
            this.filePromise = null;
        }
    }

    @ReactMethod
    public void copyToClipboard(String text, Promise promise) {
        try {
            ClipboardManager clipboard = (ClipboardManager) getReactApplicationContext().getSystemService(Context.CLIPBOARD_SERVICE);
            ClipData clip = ClipData.newPlainText("Moonlight AI", text != null ? text : "");
            if (clipboard != null) {
                clipboard.setPrimaryClip(clip);
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("CLIPBOARD_ERROR", "Failed to copy: " + e.getMessage());
        }
    }
}
