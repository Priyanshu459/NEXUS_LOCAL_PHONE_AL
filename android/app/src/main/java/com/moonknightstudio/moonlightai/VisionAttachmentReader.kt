package com.moonknightstudio.moonlightai

import android.content.Context
import android.net.Uri
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.ExifInterface
import android.media.MediaMetadataRetriever
import android.os.Build
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import java.io.File
import java.io.ByteArrayOutputStream

/** Decode selected media off the UI thread, with bounded input/output and no retained file. */
internal object VisionAttachmentReader {
  fun read(context: Context, uri: Uri, mime: String, name: String): WritableMap {
    require(uri.scheme == "content") { "Choose media using the Android file picker." }
    val video = mime.startsWith("video/")
    val maxBytes = if (video) 64L * 1024 * 1024 else 16L * 1024 * 1024
    val file = File.createTempFile("moonlight-vision-", ".media", context.cacheDir)
    try {
      context.contentResolver.openInputStream(uri)?.use { input ->
        file.outputStream().use { output ->
          val buffer = ByteArray(8192); var total = 0L
          while (true) {
            val count = input.read(buffer); if (count < 0) break
            total += count; require(total <= maxBytes) { "Choose an image under 16 MB or video under 64 MB." }
            output.write(buffer, 0, count)
          }
        }
      } ?: error("Cannot open this media file.")
      val frames = Arguments.createArray()
      var duration = 0L
      if (video) {
        if(Build.VERSION.SDK_INT < 27) throw IllegalArgumentException("Video frame analysis requires Android 8.1 or newer.")
        val reader = MediaMetadataRetriever()
        try {
          reader.setDataSource(file.absolutePath)
          duration = reader.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull() ?: 0
          require(duration in 1..60000) { "Choose a video of 60 seconds or less." }
          for (index in 0..3) {
            val time = (duration - 1) * index / 3
            val bitmap = reader.getScaledFrameAtTime(time * 1000, MediaMetadataRetriever.OPTION_CLOSEST, 768, 768)
              ?: error("Could not decode video frames. Try a different video format.")
            try { frames.pushMap(Arguments.createMap().apply { putDouble("seconds", time / 1000.0); putString("dataUrl", encode(bitmap)) }) }
            finally { bitmap.recycle() }
          }
        } finally { reader.release() }
      } else {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(file.absolutePath, bounds)
        require(bounds.outWidth > 0 && bounds.outHeight > 0 && bounds.outWidth.toLong() * bounds.outHeight <= 40000000L) { "Choose a supported image up to 40 megapixels." }
        var sample = 1
        while (maxOf(bounds.outWidth, bounds.outHeight) / sample > 1024) sample *= 2
        val bitmap = BitmapFactory.decodeFile(file.absolutePath, BitmapFactory.Options().apply { inSampleSize = sample }) ?: error("Could not decode this image.")
        try {
          val orientation = try { ExifInterface(file.absolutePath).getAttributeInt(ExifInterface.TAG_ORIENTATION, 1) } catch (_: Exception) { 1 }
          val matrix = Matrix().apply {
            when(orientation) {
              2 -> setScale(-1f, 1f)
              3 -> setRotate(180f)
              4 -> setScale(1f, -1f)
              5 -> { setRotate(90f); postScale(-1f, 1f) }
              6 -> setRotate(90f)
              7 -> { setRotate(-90f); postScale(-1f, 1f) }
              8 -> setRotate(-90f)
            }
          }
          val oriented = if(matrix.isIdentity) bitmap else Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
          try { frames.pushMap(Arguments.createMap().apply { putString("dataUrl", encode(oriented)) }) }
          finally { if(oriented !== bitmap) oriented.recycle() }
        }
        finally { bitmap.recycle() }
      }
      return Arguments.createMap().apply {
        putString("name", name.take(160)); putString("kind", if(video) "video" else "image")
        putString("size", if(video) "4 sampled frames · no audio" else "Resized image")
        putString("content", ""); putArray("frames", frames); putDouble("durationSeconds", duration / 1000.0)
      }
    } finally { file.delete() }
  }
  private fun encode(bitmap: Bitmap): String {
    for (quality in listOf(80, 60, 40)) {
      val bytes = ByteArrayOutputStream()
      bitmap.compress(Bitmap.CompressFormat.JPEG, quality, bytes)
      if(bytes.size() <= 256 * 1024) return "data:image/jpeg;base64," + Base64.encodeToString(bytes.toByteArray(), Base64.NO_WRAP)
    }
    error("Image detail is too large. Choose a smaller image.")
  }
}
