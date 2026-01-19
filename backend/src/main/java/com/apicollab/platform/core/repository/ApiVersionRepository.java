package com.apicollab.platform.core.repository;

import com.apicollab.platform.core.domain.ApiVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApiVersionRepository extends JpaRepository<ApiVersion, Long> {
    List<ApiVersion> findByApiDefinitionIdOrderByCreatedAtDesc(Long apiDefinitionId);
}
