package com.apicollab.platform.core.repository;

import com.apicollab.platform.core.domain.Environment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EnvironmentRepository extends JpaRepository<Environment, Long> {
    List<Environment> findByWorkspaceId(Long workspaceId);
}
