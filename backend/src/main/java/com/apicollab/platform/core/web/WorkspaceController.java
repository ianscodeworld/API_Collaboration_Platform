package com.apicollab.platform.core.web;

import com.apicollab.platform.core.domain.Workspace;
import com.apicollab.platform.core.service.WorkspaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    @GetMapping
    public ResponseEntity<List<Workspace>> getMyWorkspaces() {
        return ResponseEntity.ok(workspaceService.getMyWorkspaces());
    }

    @GetMapping("/personal")
    public ResponseEntity<Workspace> getPersonalWorkspace() {
        return ResponseEntity.ok(workspaceService.getOrCreatePersonalWorkspace());
    }

    @GetMapping("/all")
    public ResponseEntity<List<Workspace>> getAllWorkspaces() {
        // TODO: Add @PreAuthorize("hasRole('ADMIN')")
        return ResponseEntity.ok(workspaceService.getAllWorkspaces());
    }

    @PostMapping
    public ResponseEntity<Workspace> createWorkspace(@RequestBody Workspace workspace) {
        return ResponseEntity.ok(workspaceService.createWorkspace(workspace));
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<Workspace> shareWorkspace(@PathVariable Long id, @RequestParam String username) {
        return ResponseEntity.ok(workspaceService.shareWorkspace(id, username));
    }

    @DeleteMapping("/{id}/share")
    public ResponseEntity<Workspace> unshareWorkspace(@PathVariable Long id, @RequestParam String username) {
        return ResponseEntity.ok(workspaceService.removeUserFromWorkspace(id, username));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkspace(@PathVariable Long id) {
        workspaceService.deleteWorkspace(id);
        return ResponseEntity.noContent().build();
    }
}
