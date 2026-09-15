package com.moonknightstudio.moonlightai

import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import java.net.URL
import java.net.HttpURLConnection
import java.net.URLEncoder
import java.io.ByteArrayOutputStream
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import org.json.JSONObject

/** Credentials and credential-bearing networking stay in native code. No redirects. */
class ProviderClient(private val context: Context) {
  private val executor = Executors.newFixedThreadPool(2)
  private data class Request(val cancelled: AtomicBoolean = AtomicBoolean(false), var connection: HttpURLConnection? = null)
  private val requests = ConcurrentHashMap<String, Request>()
  private fun vault(id: String): SearchCredentialStore {
    require(id.matches(Regex("[a-zA-Z0-9_-]{1,60}")))
    return SearchCredentialStore(context, "provider_$id")
  }
  private fun validate(value: JSONObject): JSONObject {
    val studio = value.optString("connectionType") == "lmstudio"
    ProviderEndpointPolicy.validate(value.getString("baseUrl"), studio, value.optBoolean("allowLocalHttp"))
    if(studio) require(value.getString("format") == "openai")
    require(value.getString("format") in listOf("openai", "anthropic", "gemini"))
    val key = value.getString("apiKey")
    if(value.optBoolean("requireToken")) require(key.isNotBlank())
    require(key.length in (if(studio) 0 else 8)..2048 && key.none { it <= ' ' || it == '\u007f' })
    return value
  }
  fun save(id: String, raw: String, promise: Promise) {
    executor.execute {
      try {
        require(raw.length <= 4096)
        val next = JSONObject(raw)
        if(next.optBoolean("preserveExistingKey")) {
          val old = JSONObject(vault(id).read() ?: throw IllegalStateException())
          require(next.optString("connectionType") == "lmstudio" && old.optString("connectionType") == "lmstudio")
          require(next.getString("baseUrl") == old.getString("baseUrl"))
          next.put("apiKey", old.getString("apiKey"))
        }
        next.remove("preserveExistingKey")
        vault(id).save(validate(next).toString()); promise.resolve(true)
      }
      catch (_: Exception) { promise.reject("PROVIDER_SAVE", "Could not save provider. Check the HTTPS address and API key.") }
    }
  }
  fun remove(id: String, promise: Promise) {
    executor.execute {
      try { vault(id).clear(); promise.resolve(true) }
      catch (_: Exception) { promise.reject("PROVIDER_REMOVE", "Could not remove this provider. Try again.") }
    }
  }
  fun cancel(requestId: String) { requests[requestId]?.let { it.cancelled.set(true); it.connection?.disconnect() } }
  fun request(requestId: String, id: String, operation: String, model: String, body: String, promise: Promise) {
    val work = Request()
    if (requests.size >= 2 || requests.putIfAbsent(requestId, work) != null) {
      promise.reject("PROVIDER_BUSY", "Another request is running. Try again shortly."); return
    }
    executor.execute {
      try {
        require(operation in listOf("models", "chat", "responses"))
        require(body.toByteArray(Charsets.UTF_8).size <= 131072 && model.length <= 200)
        val config = validate(JSONObject(vault(id).read() ?: throw IllegalStateException()))
        val base = config.getString("baseUrl").trimEnd('/')
        // NVIDIA's hosted API has one supported wire format, regardless of model vendor.
        // Repair old saved choices without decrypting credentials into JavaScript.
        val nvidiaHosted = URL(base).host.equals("integrate.api.nvidia.com", ignoreCase = true)
        val format = if (nvidiaHosted) "openai" else config.getString("format")
        require(operation != "responses" || (URL(base).host == "api.openai.com" && format == "openai"))
        val path = if (operation == "models") "/models" else if(operation == "responses") "/responses" else when (format) {
          "anthropic" -> "/messages"
          "gemini" -> "/models/${URLEncoder.encode(model.removePrefix("models/"), "UTF-8")}:generateContent"
          else -> "/chat/completions"
        }
        check(!work.cancelled.get())
        val conn = URL(base + path).openConnection() as HttpURLConnection
        work.connection = conn
        conn.instanceFollowRedirects = false
        conn.connectTimeout = 15000; conn.readTimeout = if(operation == "models") 15000 else 60000
        conn.requestMethod = if (operation == "models") "GET" else "POST"
        conn.setRequestProperty("Content-Type", "application/json")
        when (format) {
          "anthropic" -> {conn.setRequestProperty("x-api-key", config.getString("apiKey")); conn.setRequestProperty("anthropic-version", "2023-06-01")}
          "gemini" -> conn.setRequestProperty("x-goog-api-key", config.getString("apiKey"))
          else -> if(config.getString("apiKey").isNotEmpty()) conn.setRequestProperty("Authorization", "Bearer ${config.getString("apiKey")}")
        }
        check(!work.cancelled.get())
        if (operation != "models") {
          val bytes = body.toByteArray(Charsets.UTF_8)
          conn.doOutput = true; conn.setFixedLengthStreamingMode(bytes.size)
          conn.outputStream.use { it.write(bytes) }
        }
        val status = conn.responseCode
        val output = ByteArrayOutputStream()
        // Never return provider error bodies: they can echo authentication or prompt material.
        if (status in 200..299) conn.inputStream.use { stream ->
          val buffer = ByteArray(4096)
          while (true) {
            check(!work.cancelled.get())
            val count = stream.read(buffer); if (count < 0) break
            require(output.size() + count <= 1048576)
            output.write(buffer, 0, count)
          }
        }
        check(!work.cancelled.get())
        val result = Arguments.createMap()
        // Classify a bounded error privately; never expose echoed prompts or credentials.
        if (status == 400 || status == 404 || status == 422) {
          val error = conn.errorStream?.use { stream ->
            val bytes = ByteArrayOutputStream()
            val buffer = ByteArray(1024)
            while (bytes.size() < 16384) {
              check(!work.cancelled.get())
              val count = stream.read(buffer, 0, minOf(buffer.size, 16384 - bytes.size()))
              if (count < 0) break
              bytes.write(buffer, 0, count)
            }
            bytes.toString("UTF-8").lowercase()
          } ?: ""
          val category = when {
            error.contains("system role") || error.contains("roles must") || error.contains("alternate") || error.contains("system message") -> "roles"
            error.contains("context length") || error.contains("context window") -> "context"
            error.contains("max_tokens") || error.contains("max_completion_tokens") -> "tokens"
            error.contains("model") && (error.contains("not found") || error.contains("not support") || error.contains("unknown")) -> "model"
            error.contains("function") && (error.contains("not found") || error.contains("not exist")) -> "deployment"
            else -> "request"
          }
          result.putString("errorCategory", category)
        }
        if (nvidiaHosted) result.putString("route", if(operation == "models") "NVIDIA GET /v1/models" else "NVIDIA POST /v1/chat/completions")
        result.putInt("status", status); result.putString("body", output.toString("UTF-8"))
        promise.resolve(result)
      } catch (error: Exception) {
        val detail = when(error) {
          is java.net.UnknownHostException -> "Server name could not be found. Check the address and connect your VPN if using a private remote server."
          is java.net.ConnectException -> "Server connection refused. Start the LM Studio server, check its port, and allow access through the computer firewall."
          is java.net.SocketTimeoutException -> "Server timed out. Check that the computer is awake, reachable, and connected to the same Wi-Fi or VPN."
          is javax.net.ssl.SSLException -> "HTTPS certificate verification failed. Use the exact HTTPS address from your secure tunnel; self-signed certificates are not accepted."
          else -> "Could not reach the server. Check the address, server status, firewall and Wi-Fi or VPN connection."
        }
        promise.reject("PROVIDER_REQUEST", if(work.cancelled.get()) "Request cancelled." else detail)
      } finally { work.connection?.disconnect(); requests.remove(requestId) }
    }
  }
}
