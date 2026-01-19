package com.apicollab.mock;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class ResourceController {

    @GetMapping("/protected-data")
    public ResponseEntity<?> getProtectedData(
            @RequestHeader Map<String, String> headers,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader
    ) {
        System.out.println("----- Request Start -----");
        headers.forEach((k, v) -> System.out.println(k + ": " + v));
        System.out.println("Auth Header Extracted: " + authHeader);
        System.out.println("----- Request End -----");

        if (authHeader == null || !authHeader.startsWith("Bearer mock-access-token-")) {
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized", "message", "Missing or invalid token"));
        }

        return ResponseEntity.ok(Map.of(
                "message", "This is protected data!",
                "user", "mock-user",
                "timestamp", System.currentTimeMillis()
        ));
    }
}
