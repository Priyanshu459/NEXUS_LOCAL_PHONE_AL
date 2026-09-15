package com.moonknightstudio.moonlightai

import org.junit.Test
import org.junit.Assert.assertThrows

class ProviderEndpointPolicyTest {
  @Test fun privateStudioRequiresExplicitOptIn() {
    ProviderEndpointPolicy.validate("http://192.168.1.10:1234/v1", true, true)
    ProviderEndpointPolicy.validate("http://100.100.1.10:1234/v1", true, true)
    assertThrows(IllegalArgumentException::class.java) { ProviderEndpointPolicy.validate("http://192.168.1.10:1234/v1", true, false) }
  }
  @Test fun rejectsPublicHttpAndMetadataAndHostNames() {
    for(host in listOf("8.8.8.8", "169.254.169.254", "localhost", "127.0.0.1", "computer.local", "172.32.1.1", "100.128.0.1", "10.300.1.1")) {
      assertThrows(IllegalArgumentException::class.java) { ProviderEndpointPolicy.validate("http://$host:1234/v1", true, true) }
    }
  }
  @Test fun cloudEndpointsRemainHttpsEvenWithHttpFlag() {
    ProviderEndpointPolicy.validate("https://api.openai.com/v1", false, false)
    assertThrows(IllegalArgumentException::class.java) { ProviderEndpointPolicy.validate("http://api.openai.com/v1", false, true) }
    assertThrows(IllegalArgumentException::class.java) { ProviderEndpointPolicy.validate("http://10.0.0.2/v1", false, true) }
  }
  @Test fun rejectsAmbiguousAddresses() {
    for(url in listOf("https://user:password@example.com/v1", "https://example.com/v1?key=secret", "https://example.com/v1#secret", "http://10.0.0.2/v1/chat/completions")) {
      assertThrows(IllegalArgumentException::class.java) { ProviderEndpointPolicy.validate(url, true, true) }
    }
  }
}
