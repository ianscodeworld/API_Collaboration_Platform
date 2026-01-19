package com.apicollab.platform.core.repository;

import com.apicollab.platform.core.domain.ApiDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApiDefinitionRepository extends JpaRepository<ApiDefinition, Long> {
    List<ApiDefinition> findByWorkspaceId(Long workspaceId);
}
