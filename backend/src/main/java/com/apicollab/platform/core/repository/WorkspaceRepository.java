package com.apicollab.platform.core.repository;

import com.apicollab.platform.core.domain.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {
    List<Workspace> findByOwnerUsername(String username);
    
    // Find workspaces where user is owner OR is in the shared list
    @org.springframework.data.jpa.repository.Query("SELECT w FROM Workspace w LEFT JOIN w.sharedUsers u WHERE w.owner.username = :username OR u.username = :username")
    List<Workspace> findAllForUser(String username);
}
