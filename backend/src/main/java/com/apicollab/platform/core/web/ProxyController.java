package com.apicollab.platform.core.web;

import com.apicollab.platform.core.service.ProxyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/proxy")
@RequiredArgsConstructor
public class ProxyController {

    private final ProxyService proxyService;

    @PostMapping("/execute")
    public ResponseEntity<ProxyService.ProxyResponse> execute(
            @RequestBody ProxyService.ProxyRequest request
    ) {
        return ResponseEntity.ok(proxyService.execute(request));
    }
}
