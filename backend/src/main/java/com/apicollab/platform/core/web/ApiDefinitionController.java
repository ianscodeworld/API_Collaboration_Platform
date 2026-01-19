package com.apicollab.platform.core.web;

import com.apicollab.platform.core.domain.ApiDefinition;
import com.apicollab.platform.core.service.ApiDefinitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/api-definitions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ApiDefinitionController {

    private final ApiDefinitionService apiDefinitionService;

    @GetMapping("/workspace/{workspaceId}")
    public ResponseEntity<List<ApiDefinition>> getByWorkspace(@PathVariable Long workspaceId) {
        return ResponseEntity.ok(apiDefinitionService.getByWorkspace(workspaceId));
    }

    @PostMapping
    public ResponseEntity<ApiDefinition> create(@RequestBody ApiDefinition apiDefinition) {
        return ResponseEntity.ok(apiDefinitionService.save(apiDefinition));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiDefinition> getById(@PathVariable Long id) {
        return ResponseEntity.ok(apiDefinitionService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiDefinition> update(@PathVariable Long id, @RequestBody ApiDefinition apiDefinition) {
        ApiDefinition existing = apiDefinitionService.getById(id);
        existing.setTitle(apiDefinition.getTitle());
        existing.setContent(apiDefinition.getContent());
        return ResponseEntity.ok(apiDefinitionService.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        apiDefinitionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
