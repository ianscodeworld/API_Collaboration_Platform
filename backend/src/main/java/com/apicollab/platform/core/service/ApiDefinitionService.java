package com.apicollab.platform.core.service;

import com.apicollab.platform.auth.domain.User;
import com.apicollab.platform.core.domain.ApiDefinition;
import com.apicollab.platform.core.repository.ApiDefinitionRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ApiDefinitionService {

    private final ApiDefinitionRepository apiDefinitionRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ApiVersionService apiVersionService;
    private final EntityManager entityManager;

    public List<ApiDefinition> getByWorkspace(Long workspaceId) {
        return apiDefinitionRepository.findByWorkspaceId(workspaceId);
    }

    @Transactional
    public ApiDefinition save(ApiDefinition apiDefinition) {
        // Auto-Snapshot logic
        if (apiDefinition.getId() != null) {
            // Detach the incoming entity so we can fetch the pristine one from the DB
            entityManager.detach(apiDefinition);
            apiDefinitionRepository.findById(apiDefinition.getId()).ifPresent(existing -> {
                
                String oldContent = existing.getContent();
                String newContent = apiDefinition.getContent();
                
                String oldTitle = existing.getTitle();
                String newTitle = apiDefinition.getTitle();

                boolean contentChanged = !Objects.equals(oldContent, newContent);
                boolean titleChanged = !Objects.equals(oldTitle, newTitle);
                
                if (contentChanged || titleChanged) {
                    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                    User currentUser = (authentication != null) ? (User) authentication.getPrincipal() : null;

                    String desc = "Auto-save: " + (titleChanged ? "Title updated" : "Content updated");
                    apiVersionService.createSnapshot(existing, desc, currentUser);
                }
            });
        }

        ApiDefinition saved = apiDefinitionRepository.save(apiDefinition);
        messagingTemplate.convertAndSend("/topic/updates", 
            new SyncMessage("API_DEFINITION", saved.getId(), "UPDATE"));
        return saved;
    }

    public ApiDefinition getById(Long id) {
        return apiDefinitionRepository.findById(id).orElseThrow();
    }

    public void delete(Long id) {
        apiDefinitionRepository.deleteById(id);
        // Optional: Broadcast delete event
        messagingTemplate.convertAndSend("/topic/updates", 
            new SyncMessage("API_DEFINITION", id, "DELETE"));
    }

    // Inner class for simple sync message
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class SyncMessage {
        private String type;
        private Long id;
        private String action;
    }
}
