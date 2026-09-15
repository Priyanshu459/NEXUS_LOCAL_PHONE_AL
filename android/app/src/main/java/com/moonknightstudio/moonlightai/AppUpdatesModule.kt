package com.moonknightstudio.moonlightai

import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.*
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.install.model.UpdateAvailability

/** Play decides availability for the installed package, account and release track. */
class AppUpdatesModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "AppUpdates"

  @ReactMethod
  fun check(promise: Promise) {
    // Preview APKs have a separate application ID and no Google Play listing.
    if (context.packageName.endsWith(".preview")) {
      promise.resolve(null)
      return
    }
    try {
      AppUpdateManagerFactory.create(context).appUpdateInfo
        .addOnSuccessListener { info ->
          if (info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE &&
              info.availableVersionCode() > BuildConfig.VERSION_CODE) {
            promise.resolve(Arguments.createMap().apply {
              putInt("versionCode", info.availableVersionCode())
            })
          } else promise.resolve(null)
        }
        // Offline, non-Play installs and account ineligibility must not interrupt chat.
        .addOnFailureListener { promise.resolve(null) }
    } catch (_: Exception) { promise.resolve(null) }
  }

  @ReactMethod
  fun openStore(promise: Promise) {
    if (context.packageName.endsWith(".preview")) {
      promise.reject("PREVIEW", "Preview builds do not have a Play Store listing.")
      return
    }
    val id = context.packageName
    try {
      context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$id"))
        .setPackage("com.android.vending").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      promise.resolve(true)
    } catch (_: Exception) {
      try {
        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=$id"))
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        promise.resolve(true)
      } catch (_: Exception) { promise.reject("STORE_UNAVAILABLE", "Could not open Google Play.") }
    }
  }
}
