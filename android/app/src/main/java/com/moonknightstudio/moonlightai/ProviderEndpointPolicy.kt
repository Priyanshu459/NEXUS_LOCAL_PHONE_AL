package com.moonknightstudio.moonlightai

import java.net.URL

internal object ProviderEndpointPolicy {
  fun validate(raw: String, studio: Boolean, allowHttp: Boolean) {
    val base = URL(raw)
    require(base.userInfo == null && base.query == null && base.ref == null)
    if(studio) {
      require(base.path.trimEnd('/') == "/v1")
      require(base.protocol == "https" || (base.protocol == "http" && allowHttp && privateIpv4(base.host)))
    } else {
      require(base.protocol == "https")
      require(base.host.contains('.') && !base.host.endsWith(".local") && !base.host.matches(Regex("[0-9.]+")))
    }
  }
  private fun privateIpv4(host: String): Boolean {
    if(!host.matches(Regex("[0-9]{1,3}(\\.[0-9]{1,3}){3}"))) return false
    val p = host.split('.').map { it.toInt() }
    if(p.any { it !in 0..255 }) return false
    return p[0] == 10 || (p[0] == 192 && p[1] == 168) ||
      (p[0] == 172 && p[1] in 16..31) || (p[0] == 100 && p[1] in 64..127)
  }
}
