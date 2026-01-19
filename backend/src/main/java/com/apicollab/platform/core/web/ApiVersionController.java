package com.apicollab.platform.core.web;

import com.apicollab.platform.auth.domain.User;
import com.apicollab.platform.core.domain.ApiDefinition;
import com.apicollab.platform.core.domain.ApiVersion;
import com.apicollab.platform.core.service.ApiDefinitionService;
import com.apicollab.platform.core.service.ApiVersionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/api-versions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ApiVersionController {

    private final ApiVersionService apiVersionService;
    private final ApiDefinitionService apiDefinitionService;

    @GetMapping("/api/{apiId}")
    public ResponseEntity<List<ApiVersion>> getHistory(@PathVariable Long apiId) {
        return ResponseEntity.ok(apiVersionService.getHistory(apiId));
    }

    @PostMapping("/api/{apiId}")
    public ResponseEntity<ApiVersion> createSnapshot(@PathVariable Long apiId, @RequestBody Map<String, String> body) {
        ApiDefinition api = apiDefinitionService.getById(apiId);
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(apiVersionService.createSnapshot(api, body.get("description"), currentUser));
    }

    @PostMapping("/{versionId}/restore")
    public ResponseEntity<ApiDefinition> restore(@PathVariable Long versionId) {
        return ResponseEntity.ok(apiVersionService.restore(versionId));
    }
}
