package com.moonknightstudio.moonlightai

import android.app.Activity
import android.app.ActivityManager
import android.os.StatFs
import android.os.Build
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.database.Cursor
import android.net.Uri
import android.provider.OpenableColumns
import android.speech.RecognizerIntent
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.Locale
import java.net.URL
import javax.net.ssl.HttpsURLConnection
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicBoolean
import java.io.ByteArrayOutputStream
import org.json.JSONObject

class DeviceControlModule(
  private val appContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(appContext) {
  companion object {
    private const val SPEECH_REQUEST_CODE = 4100
    private const val FILE_REQUEST_CODE = 4101
    private val MAX_TEXT_FILE_BYTES = BoundedTextReader.MAX_BYTES.toLong()
  }

  private var speechPromise: Promise? = null
  private val searchCredentials = SearchCredentialStore(appContext)
  private val credentialExecutor = java.util.concurrent.Executors.newSingleThreadExecutor()

  @ReactMethod
  fun saveSearchCredentials(value: String, promise: Promise) {
    credentialExecutor.execute {
      try { searchCredentials.save(value); promise.resolve(true) }
      catch (_: Exception) { promise.reject("SEARCH_STORAGE", "Could not securely save search access. Try again.") }
    }
  }
  @ReactMethod
  fun readSearchCredentials(promise: Promise) {
    credentialExecutor.execute {
      try { promise.resolve(searchCredentials.read()) }
      catch (_: Exception) { promise.reject("SEARCH_STORAGE", "Saved search access could not be unlocked. Re-enter your key in Settings.") }
    }
  }
  @ReactMethod
  fun clearSearchCredentials(promise: Promise) {
    credentialExecutor.execute {
      try { searchCredentials.clear(); promise.resolve(true) }
      catch (_: Exception) { promise.reject("SEARCH_STORAGE", "Could not remove saved search access. Try again.") }
    }
  }
  private var filePromise: Promise? = null
  private data class SearchRequest(val connection: HttpsURLConnection, val cancelled: AtomicBoolean = AtomicBoolean(false))
  private val searches = ConcurrentHashMap<String, SearchRequest>()

  @ReactMethod
  fun cancelWebSearch(requestId: String) {
    searches[requestId]?.let { it.cancelled.set(true); it.connection.disconnect() }
  }

  @ReactMethod
  fun requestWebSearch(requestId: String, endpoint: String, code: String, query: String, promise: Promise) {
    try {
      val url = URL(endpoint)
      require(url.protocol == "https" && url.userInfo == null && url.query == null && url.ref == null)
      require(query.isNotBlank() && query.length <= 400 && code.matches(Regex("[A-Za-z0-9_-]{32,128}")))
      require(searches.isEmpty()) { "A search is already running" }
      val connection = url.openConnection() as HttpsURLConnection
      val request = SearchRequest(connection)
      searches[requestId] = request
      Thread {
        try {
          if (request.cancelled.get()) throw IllegalStateException("Cancelled")
          connection.instanceFollowRedirects = false
          connection.connectTimeout = 10000
          connection.readTimeout = 10000
          connection.requestMethod = "POST"
          connection.doOutput = true
          connection.setRequestProperty("Content-Type", "application/json")
          connection.setRequestProperty("Authorization", "Bearer $code")
          val payload = JSONObject().put("query", query).toString().toByteArray(Charsets.UTF_8)
          connection.setFixedLengthStreamingMode(payload.size)
          connection.outputStream.use { it.write(payload) }
          val status = connection.responseCode
          val output = ByteArrayOutputStream()
          // Never follow redirects with tester credentials, or buffer unbounded responses.
          if (status == 200) connection.inputStream.use { stream ->
            val buffer = ByteArray(2048)
            while (true) {
              if (request.cancelled.get()) throw IllegalStateException("Cancelled")
              val count = stream.read(buffer)
              if (count < 0) break
              require(output.size() + count <= 16000) { "Response too large" }
              output.write(buffer, 0, count)
            }
          }
          if (request.cancelled.get()) throw IllegalStateException("Cancelled")
          val result = Arguments.createMap()
          result.putInt("status", status)
          result.putString("body", output.toString("UTF-8"))
          promise.resolve(result)
        } catch (error: Exception) {
          promise.reject("SEARCH_FAILED", "Search could not complete. Check the connection or try again.")
        } finally {
          connection.disconnect()
          searches.remove(requestId)
        }
      }.start()
    } catch (error: Exception) { promise.reject("SEARCH_CONFIG", "Search connection is invalid or busy.") }
  }

  private val activityEventListener: ActivityEventListener =
    object : BaseActivityEventListener() {
      override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?,
      ) {
        when (requestCode) {
          SPEECH_REQUEST_CODE -> finishSpeechRequest(resultCode, data)
          FILE_REQUEST_CODE -> finishFileRequest(activity, resultCode, data)
        }
      }
    }

  init {
    appContext.addActivityEventListener(activityEventListener)
  }

  override fun getName(): String = "DeviceControl"

  @ReactMethod
  fun getDeviceCapacity(promise: Promise) {
    try {
      val manager = appContext.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
      val info = ActivityManager.MemoryInfo()
      manager.getMemoryInfo(info)
      val disk = StatFs(appContext.filesDir.absolutePath)
      promise.resolve(Arguments.createMap().apply {
        putDouble("totalMemory", info.totalMem.toDouble())
        putDouble("availableMemory", info.availMem.toDouble())
        putDouble("freeStorage", disk.availableBytes.toDouble())
        putBoolean("is64Bit", Build.SUPPORTED_64_BIT_ABIS.isNotEmpty())
      })
    } catch (error: Exception) {
      promise.reject("CAPACITY_ERROR", "Could not check device capacity.", error)
    }
  }

  @ReactMethod
  fun startSpeechRecognition(promise: Promise) {
    val activity = appContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "Voice input is unavailable because the app is not active.")
      return
    }
    if (speechPromise != null) {
      promise.reject("REQUEST_IN_PROGRESS", "Voice input is already active.")
      return
    }

    val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
      putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
      putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault().toLanguageTag())
      putExtra(RecognizerIntent.EXTRA_PROMPT, "Speak to Moonlight AI")
      putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
    }
    if (intent.resolveActivity(activity.packageManager) == null) {
      promise.reject(
        "SPEECH_UNAVAILABLE",
        "No speech-recognition service is available on this device.",
      )
      return
    }

    speechPromise = promise
    try {
      activity.startActivityForResult(intent, SPEECH_REQUEST_CODE)
    } catch (error: Exception) {
      speechPromise = null
      promise.reject("SPEECH_ERROR", "Could not start voice input.", error)
    }
  }

  private fun finishSpeechRequest(resultCode: Int, data: Intent?) {
    val promise = speechPromise ?: return
    speechPromise = null
    if (resultCode != Activity.RESULT_OK || data == null) {
      promise.reject("CANCELLED", "Voice input was cancelled.")
      return
    }

    val result = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)?.firstOrNull()
    if (result.isNullOrBlank()) {
      promise.reject("NO_RESULT", "No speech was recognized. Please try again.")
    } else {
      promise.resolve(result)
    }
  }

  @ReactMethod
  fun pickFile(promise: Promise) {
    val activity = appContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "The file picker is unavailable because the app is not active.")
      return
    }
    if (filePromise != null) {
      promise.reject("REQUEST_IN_PROGRESS", "The file picker is already active.")
      return
    }

    val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
      type = "*/*"
      addCategory(Intent.CATEGORY_OPENABLE)
    }
    if (intent.resolveActivity(activity.packageManager) == null) {
      promise.reject("PICKER_UNAVAILABLE", "No compatible file picker is installed.")
      return
    }

    filePromise = promise
    try {
      activity.startActivityForResult(
        Intent.createChooser(intent, "Select a file for Moonlight AI"),
        FILE_REQUEST_CODE,
      )
    } catch (error: Exception) {
      filePromise = null
      promise.reject("PICKER_ERROR", "Could not open the file picker.", error)
    }
  }

  private fun finishFileRequest(activity: Activity, resultCode: Int, data: Intent?) {
    val promise = filePromise ?: return
    filePromise = null
    if (resultCode != Activity.RESULT_OK || data?.data == null) {
      promise.reject("CANCELLED", "File selection was cancelled.")
      return
    }

    try {
      promise.resolve(readSelectedFile(activity, data.data!!))
    } catch (error: Exception) {
      promise.reject("READ_ERROR", "Failed to read the selected file.", error)
    }
  }

  private fun readSelectedFile(activity: Activity, uri: Uri) =
    Arguments.createMap().apply {
      var displayName = "selected-file"
      var sizeBytes = 0L
      activity.contentResolver.query(uri, null, null, null, null)?.use { cursor: Cursor ->
        if (cursor.moveToFirst()) {
          cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME).takeIf { it >= 0 }?.let {
            displayName = cursor.getString(it)?.takeIf(String::isNotBlank) ?: displayName
          }
          cursor.getColumnIndex(OpenableColumns.SIZE).takeIf { it >= 0 && !cursor.isNull(it) }?.let {
            sizeBytes = cursor.getLong(it)
          }
        }
      }

      val sizeLabel = if (sizeBytes > 1024) "${sizeBytes / 1024} KB" else "$sizeBytes B"
      val lowerName = displayName.lowercase(Locale.ROOT)
      val binaryExtensions = listOf(".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".pdf", ".zip")
      val content = when {
        binaryExtensions.any(lowerName::endsWith) ->
          "[Attached File: $displayName ($sizeLabel)]\nThis binary file cannot be read by the local text-only model. Paste any relevant text into the chat."
        sizeBytes > MAX_TEXT_FILE_BYTES ->
          "[Attached File: $displayName ($sizeLabel)]\nThis file is larger than the 512 KB text attachment limit. Paste a smaller excerpt into the chat."
        else -> readTextContent(activity, uri)
      }

      putString("name", displayName)
      putString("size", sizeLabel)
      putString("content", content)
      putString("uri", uri.toString())
    }

  private fun readTextContent(activity: Activity, uri: Uri): String {
    val input = activity.contentResolver.openInputStream(uri)
      ?: throw IllegalStateException("Unable to open the selected file")
    return input.use { stream -> BoundedTextReader.read(stream) }
  }

  @ReactMethod
  fun copyToClipboard(text: String?, promise: Promise) {
    try {
      val clipboard = appContext.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
      if (clipboard == null) {
        promise.reject("CLIPBOARD_UNAVAILABLE", "The clipboard service is unavailable.")
        return
      }
      clipboard.setPrimaryClip(ClipData.newPlainText("Moonlight AI", text.orEmpty()))
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("CLIPBOARD_ERROR", "Failed to copy text.", error)
    }
  }

  override fun invalidate() {
    appContext.removeActivityEventListener(activityEventListener)
    speechPromise?.reject("MODULE_DESTROYED", "Voice input stopped because the app closed.")
    filePromise?.reject("MODULE_DESTROYED", "File selection stopped because the app closed.")
    speechPromise = null
    filePromise = null
    super.invalidate()
  }
}
