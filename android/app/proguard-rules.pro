# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in getDefaultProguardFile("proguard-android.txt")

# ----------------------------------------------------------------------
# React Native Core & Reflection
# ----------------------------------------------------------------------
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep,allowobfuscation @interface com.facebook.react.uimanager.annotations.ReactProp
-keep,allowobfuscation @interface com.facebook.react.uimanager.annotations.ReactPropGroup

-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keep @com.facebook.proguard.annotations.KeepGettersAndSetters class *

-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.proguard.annotations.KeepGettersAndSetters *;
}

-keepclassmembers class * extends com.facebook.react.bridge.ReactContextBaseJavaModule {
    @com.facebook.react.bridge.ReactMethod *;
}

-keep class * extends com.facebook.react.bridge.JavaScriptModule { *; }

-dontwarn com.facebook.react.**

# ----------------------------------------------------------------------
# llama.rn (Native C++ JNI & LlamaContext)
# ----------------------------------------------------------------------
-keep class com.rnllama.** { *; }
-keepclassmembers class com.rnllama.** { *; }
-dontwarn com.rnllama.**

# ----------------------------------------------------------------------
# MMKV & Nitro Modules
# ----------------------------------------------------------------------
-keep class com.tencent.mmkv.** { *; }
-keepclassmembers class com.tencent.mmkv.** { *; }
-keep class com.mrousavy.mmkv.** { *; }
-keepclassmembers class com.mrousavy.mmkv.** { *; }
-keep class com.margelo.nitro.** { *; }
-keepclassmembers class com.margelo.nitro.** { *; }
-dontwarn com.tencent.mmkv.**
-dontwarn com.mrousavy.mmkv.**
-dontwarn com.margelo.nitro.**

# ----------------------------------------------------------------------
# React Native Screens & Safe Area Context
# ----------------------------------------------------------------------
-keep class com.swmansion.rnscreens.** { *; }
-keepclassmembers class com.swmansion.rnscreens.** { *; }
-keep class com.th3rdwave.safeareacontext.** { *; }
-keepclassmembers class com.th3rdwave.safeareacontext.** { *; }
-dontwarn com.swmansion.rnscreens.**
-dontwarn com.th3rdwave.safeareacontext.**

# ----------------------------------------------------------------------
# React Native File System
# ----------------------------------------------------------------------
-keep class com.rnfs.** { *; }
-keepclassmembers class com.rnfs.** { *; }
-dontwarn com.rnfs.**

# ----------------------------------------------------------------------
# Moonlight AI Native Modules & Helpers
# ----------------------------------------------------------------------
-keep class com.moonknightstudio.moonlightai.** { *; }
-keepclassmembers class com.moonknightstudio.moonlightai.** { *; }

# ----------------------------------------------------------------------
# Google Play In-App Updates
# ----------------------------------------------------------------------
-keep class com.google.android.play.core.** { *; }
-keepclassmembers class com.google.android.play.core.** { *; }
-dontwarn com.google.android.play.core.**
