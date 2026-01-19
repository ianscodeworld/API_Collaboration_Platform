package com.apicollab.platform.core.web;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/test")
public class TestController {

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }

    @GetMapping("/json")
    public ResponseEntity<Map<String, Object>> getJson() {
        return ResponseEntity.ok(Map.of(
                "id", 123,
                "message", "Hello from Test API",
                "status", "success"
        ));
    }

    @PostMapping("/echo")
    public ResponseEntity<Object> echo(@RequestBody Object body) {
        return ResponseEntity.ok(Map.of(
                "received", body,
                "timestamp", System.currentTimeMillis()
        ));
    }

    @GetMapping("/headers")
    public ResponseEntity<Map<String, String>> echoHeaders(@RequestHeader Map<String, String> headers) {
        return ResponseEntity.ok(headers);
    }
    
    @GetMapping("/params")
    public ResponseEntity<Map<String, String>> echoParams(@RequestParam Map<String, String> params) {
        return ResponseEntity.ok(params);
    }

    @GetMapping("/error")
    public ResponseEntity<String> error() {
        return ResponseEntity.status(500).body("Simulated Internal Server Error");
    }
}
