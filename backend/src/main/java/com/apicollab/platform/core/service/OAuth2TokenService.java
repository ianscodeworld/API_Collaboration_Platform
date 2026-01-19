package com.apicollab.platform.core.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class OAuth2TokenService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final Map<String, TokenCache> tokenCache = new ConcurrentHashMap<>();

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OAuth2Config {
        private String tokenUrl;
        private String clientId;
        private String clientSecret;
        private String grantType; // default client_credentials
        private String scope;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class TokenResponse {
        private String access_token;
        private int expires_in;
        private String token_type;
    }

    @Data
    private static class TokenCache {
        private String token;
        private LocalDateTime expiresAt;
    }

    public String getToken(String configKey, OAuth2Config config) {
        // 1. Check Cache
        if (tokenCache.containsKey(configKey)) {
            TokenCache cache = tokenCache.get(configKey);
            if (cache.getExpiresAt().isAfter(LocalDateTime.now().plusSeconds(30))) { // Buffer
                log.info("Using cached token for {}", configKey);
                return cache.getToken();
            }
        }

        // 2. Fetch New Token
        log.info("Fetching new token for {}", configKey);
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("grant_type", config.getGrantType() != null ? config.getGrantType() : "client_credentials");
            map.add("client_id", config.getClientId());
            map.add("client_secret", config.getClientSecret());
            if (config.getScope() != null && !config.getScope().isEmpty()) {
                map.add("scope", config.getScope());
            }

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);

            ResponseEntity<TokenResponse> response = restTemplate.postForEntity(
                    config.getTokenUrl(),
                    request,
                    TokenResponse.class
            );

            if (response.getBody() != null && response.getBody().getAccess_token() != null) {
                String token = response.getBody().getAccess_token();
                int expiresIn = response.getBody().getExpires_in();
                
                TokenCache newCache = new TokenCache();
                newCache.setToken(token);
                // Default 1 hour if not provided, else use expires_in
                newCache.setExpiresAt(LocalDateTime.now().plusSeconds(expiresIn > 0 ? expiresIn : 3600));
                
                tokenCache.put(configKey, newCache);
                return token;
            }
        } catch (Exception e) {
            log.error("Failed to fetch token for {}: {}", configKey, e.getMessage());
            throw new RuntimeException("Failed to fetch OAuth2 token: " + e.getMessage());
        }

        throw new RuntimeException("Failed to retrieve access token");
    }
}
