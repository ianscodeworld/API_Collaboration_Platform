package com.apicollab.platform.core.service;

import com.apicollab.platform.core.domain.Environment;
import com.apicollab.platform.core.repository.EnvironmentRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ProxyService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final EnvironmentRepository environmentRepository;
    private final OAuth2TokenService oAuth2TokenService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Data
    public static class ProxyRequest {
        private String url;
        private String method;
        private Map<String, String> headers;
        private String body;
        private Long environmentId;
    }

    @Data
    public static class ProxyResponse {
        private int status;
        private Map<String, String> headers;
        private String body;
    }

    public ProxyResponse execute(ProxyRequest request) {
        // 1. Load Environment & Process Auto-Auth
        if (request.getEnvironmentId() != null) {
            processEnvironment(request);
        }

        HttpHeaders headers = new HttpHeaders();
        if (request.getHeaders() != null) {
            request.getHeaders().forEach(headers::add);
        }

        HttpEntity<String> entity = new HttpEntity<>(request.getBody(), headers);
        HttpMethod method = HttpMethod.valueOf(request.getMethod().toUpperCase());

        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    request.getUrl(),
                    method,
                    entity,
                    byte[].class
            );

            ProxyResponse proxyResponse = new ProxyResponse();
            proxyResponse.setStatus(response.getStatusCode().value());
            
            byte[] bodyBytes = response.getBody();
            String contentType = response.getHeaders().getFirst(HttpHeaders.CONTENT_TYPE);
            
            if (bodyBytes != null) {
                if (contentType != null && (contentType.contains("text") || contentType.contains("json") || contentType.contains("xml"))) {
                    proxyResponse.setBody(new String(bodyBytes));
                } else {
                    // Binary data: Encode as Base64 with data URI prefix
                    String base64 = java.util.Base64.getEncoder().encodeToString(bodyBytes);
                    proxyResponse.setBody("data:" + (contentType != null ? contentType : "application/octet-stream") + ";base64," + base64);
                }
            }
            
            Map<String, String> respHeaders = new java.util.HashMap<>();
            response.getHeaders().forEach((k, v) -> respHeaders.put(k, v.get(0)));
            proxyResponse.setHeaders(respHeaders);

            return proxyResponse;
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            ProxyResponse proxyResponse = new ProxyResponse();
            proxyResponse.setStatus(e.getStatusCode().value());
            proxyResponse.setBody(e.getResponseBodyAsString());
            return proxyResponse;
        } catch (Exception e) {
            ProxyResponse proxyResponse = new ProxyResponse();
            proxyResponse.setStatus(500);
            proxyResponse.setBody(e.getMessage());
            return proxyResponse;
        }
    }

    private void processEnvironment(ProxyRequest request) {
        Environment env = environmentRepository.findById(request.getEnvironmentId()).orElse(null);
        if (env == null || env.getAuthConfigs() == null) return;

        try {
            Map<String, OAuth2TokenService.OAuth2Config> authConfigs = 
                objectMapper.readValue(env.getAuthConfigs(), new TypeReference<>() {});
            
            System.out.println("DEBUG: Loaded Auth Configs: " + authConfigs.keySet());

            // Regex to find {{key}}
            Pattern pattern = Pattern.compile("\\{\\{(.+?)}}");
            
            // Check Headers
            if (request.getHeaders() != null) {
                request.getHeaders().replaceAll((k, v) -> {
                    String newVal = replaceToken(v, authConfigs);
                    if (!v.equals(newVal)) {
                        System.out.println("DEBUG: Header " + k + " replaced. Old: " + v + ", New: " + newVal);
                    }
                    return newVal;
                });
            }
            
            // Check URL
            String newUrl = replaceToken(request.getUrl(), authConfigs);
            if (!request.getUrl().equals(newUrl)) {
                System.out.println("DEBUG: URL replaced. New: " + newUrl);
            }
            request.setUrl(newUrl);

        } catch (Exception e) {
            System.err.println("Failed to process environment auth: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String replaceToken(String input, Map<String, OAuth2TokenService.OAuth2Config> authConfigs) {
        if (input == null) return null;
        Matcher matcher = Pattern.compile("\\{\\{(.+?)}}").matcher(input);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            String key = matcher.group(1).trim(); // Fix: Trim whitespace
            System.out.println("DEBUG: Found placeholder: " + key);
            if (authConfigs.containsKey(key)) {
                try {
                    String token = oAuth2TokenService.getToken(key, authConfigs.get(key));
                    System.out.println("DEBUG: Token fetched for " + key + ": " + (token != null ? "Yes" : "No"));
                    matcher.appendReplacement(sb, "Bearer " + token);
                } catch (Exception e) {
                    System.err.println("DEBUG: Token fetch failed for " + key + ": " + e.getMessage());
                    matcher.appendReplacement(sb, matcher.group(0));
                }
            } else {
                System.out.println("DEBUG: Key " + key + " not found in auth configs.");
                matcher.appendReplacement(sb, matcher.group(0)); // Keep original if not found
            }
        }
        matcher.appendTail(sb);
        return sb.toString();
    }
}
