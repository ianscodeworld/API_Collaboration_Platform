package com.apicollab.platform.core.service;

import com.apicollab.platform.core.domain.Environment;
import com.apicollab.platform.core.domain.Workspace;
import com.apicollab.platform.core.repository.EnvironmentRepository;
import com.apicollab.platform.core.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EnvironmentService {

    private final EnvironmentRepository environmentRepository;
    private final WorkspaceRepository workspaceRepository;

    public List<Environment> getByWorkspace(Long workspaceId) {
        return environmentRepository.findByWorkspaceId(workspaceId);
    }

    public Environment create(Environment environment) {
        // Ensure workspace exists
        Workspace ws = workspaceRepository.findById(environment.getWorkspace().getId())
                .orElseThrow(() -> new RuntimeException("Workspace not found"));
        environment.setWorkspace(ws);
        return environmentRepository.save(environment);
    }

    public Environment update(Long id, Environment updated) {
        Environment existing = environmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Environment not found"));
        
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setVariables(updated.getVariables());
        existing.setAuthConfigs(updated.getAuthConfigs());
        
        return environmentRepository.save(existing);
    }

    public void delete(Long id) {
        environmentRepository.deleteById(id);
    }
}
