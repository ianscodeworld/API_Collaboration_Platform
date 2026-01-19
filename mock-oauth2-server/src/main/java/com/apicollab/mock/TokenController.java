package com.apicollab.mock;

import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/oauth")
public class TokenController {

    @PostMapping("/token")
    public ResponseEntity<Map<String, Object>> getToken(
            @RequestParam("grant_type") String grantType,
            @RequestParam("client_id") String clientId,
            @RequestParam("client_secret") String clientSecret,
            @RequestParam(value = "scope", required = false) String scope
    ) {
        System.out.println("Received Token Request:");
        System.out.println("Grant Type: " + grantType);
        System.out.println("Client ID: " + clientId);
        System.out.println("Client Secret: " + clientSecret);

        // Simple validation mock
        if (!"client_credentials".equals(grantType)) {
            return ResponseEntity.badRequest().body(Map.of("error", "unsupported_grant_type"));
        }

        if ("test-client".equals(clientId) && "test-secret".equals(clientSecret)) {
            Map<String, Object> response = new HashMap<>();
            response.put("access_token", "mock-access-token-" + UUID.randomUUID().toString());
            response.put("token_type", "Bearer");
            response.put("expires_in", 3600);
            response.put("scope", scope != null ? scope : "read write");
            
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body(Map.of("error", "invalid_client"));
        }
    }
}
