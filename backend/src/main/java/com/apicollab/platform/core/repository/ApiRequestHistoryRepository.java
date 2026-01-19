package com.apicollab.platform.core.repository;

import com.apicollab.platform.core.domain.ApiRequestHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApiRequestHistoryRepository extends JpaRepository<ApiRequestHistory, Long> {
    List<ApiRequestHistory> findByWorkspaceIdAndUserUsernameOrderByExecutedAtDesc(Long workspaceId, String username, Pageable pageable);
    
    // For overwrite check
    ApiRequestHistory findFirstByWorkspaceIdAndUserUsernameOrderByExecutedAtDesc(Long workspaceId, String username);
}
