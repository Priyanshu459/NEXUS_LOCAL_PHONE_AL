package com.moonknightstudio.moonlightai

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/** Only ciphertext is persisted. The encryption key remains in Android Keystore. */
class SearchCredentialStore(context: Context, namespace: String = "search") {
  init { require(namespace.matches(Regex("[a-zA-Z0-9_-]{1,100}"))) }
  private val prefs = context.getSharedPreferences("moonlight_${namespace}_secret", Context.MODE_PRIVATE)
  private val alias = "moonlight.$namespace.v1"
  private fun key(): SecretKey {
    val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    (store.getKey(alias, null) as? SecretKey)?.let { return it }
    return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore").apply {
      init(KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
        .setKeySize(256).build())
    }.generateKey()
  }
  @Synchronized fun save(value: String) {
    require(value.length <= 4096)
    val cipher = Cipher.getInstance("AES/GCM/NoPadding").apply { init(Cipher.ENCRYPT_MODE, key()) }
    val data = cipher.doFinal(value.toByteArray(Charsets.UTF_8))
    check(prefs.edit().putString("data", Base64.encodeToString(cipher.iv + data, Base64.NO_WRAP)).commit())
  }
  @Synchronized fun read(): String? {
    val stored = prefs.getString("data", null) ?: return null
    val bytes = Base64.decode(stored, Base64.NO_WRAP)
    require(bytes.size > 28)
    val cipher = Cipher.getInstance("AES/GCM/NoPadding").apply {
      init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(128, bytes.copyOfRange(0, 12)))
    }
    return String(cipher.doFinal(bytes.copyOfRange(12, bytes.size)), Charsets.UTF_8)
  }
  @Synchronized fun clear() { check(prefs.edit().remove("data").commit()) }
}
