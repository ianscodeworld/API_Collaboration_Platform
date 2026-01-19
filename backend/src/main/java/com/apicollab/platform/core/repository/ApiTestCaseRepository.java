package com.apicollab.platform.core.repository;

import com.apicollab.platform.core.domain.ApiTestCase;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApiTestCaseRepository extends JpaRepository<ApiTestCase, Long> {
    List<ApiTestCase> findByApiDefinitionId(Long apiDefinitionId);
}
