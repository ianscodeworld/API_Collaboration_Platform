package com.apicollab.platform.core.service;

import com.apicollab.platform.auth.domain.User;
import com.apicollab.platform.core.domain.ApiDefinition;
import com.apicollab.platform.core.domain.ApiVersion;
import com.apicollab.platform.core.repository.ApiDefinitionRepository;
import com.apicollab.platform.core.repository.ApiVersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApiVersionService {

    private final ApiVersionRepository apiVersionRepository;
    private final ApiDefinitionRepository apiDefinitionRepository;

    public List<ApiVersion> getHistory(Long apiId) {
        return apiVersionRepository.findByApiDefinitionIdOrderByCreatedAtDesc(apiId);
    }

    public ApiVersion createSnapshot(ApiDefinition api, String description, User user) {
        ApiVersion version = ApiVersion.builder()
                .apiDefinition(api)
                .content(api.getContent())
                .description(description != null ? description : "Snapshot")
                .createdBy(user)
                .build();
        
        return apiVersionRepository.save(version);
    }

    public ApiDefinition restore(Long versionId) {
        ApiVersion version = apiVersionRepository.findById(versionId)
                .orElseThrow(() -> new RuntimeException("Version not found"));
        
        ApiDefinition api = version.getApiDefinition();
        api.setContent(version.getContent());
        
        // Note: Restoring does not change the original creator of the snapshot.
        // If we wanted to track who restored it, we'd need another field.
        
        return apiDefinitionRepository.save(api);
    }
}
