package com.apicollab.platform.core.web;

import com.apicollab.platform.core.domain.Environment;
import com.apicollab.platform.core.service.EnvironmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/environments")
@RequiredArgsConstructor
public class EnvironmentController {

    private final EnvironmentService environmentService;

    @GetMapping("/workspace/{workspaceId}")
    public ResponseEntity<List<Environment>> getByWorkspace(@PathVariable Long workspaceId) {
        return ResponseEntity.ok(environmentService.getByWorkspace(workspaceId));
    }

    @PostMapping
    public ResponseEntity<Environment> create(@RequestBody Environment environment) {
        return ResponseEntity.ok(environmentService.create(environment));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Environment> update(@PathVariable Long id, @RequestBody Environment environment) {
        return ResponseEntity.ok(environmentService.update(id, environment));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        environmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
