package com.apicollab.platform.core.service;

import com.apicollab.platform.auth.domain.User;
import com.apicollab.platform.auth.repository.UserRepository;
import com.apicollab.platform.common.SecurityUtils;
import com.apicollab.platform.core.domain.ApiRequestHistory;
import com.apicollab.platform.core.domain.Workspace;
import com.apicollab.platform.core.repository.ApiRequestHistoryRepository;
import com.apicollab.platform.core.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ApiRequestHistoryService {

    private final ApiRequestHistoryRepository historyRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;

    public List<ApiRequestHistory> getHistory(Long workspaceId) {
        String username = SecurityUtils.getCurrentUsername();
        return historyRepository.findByWorkspaceIdAndUserUsernameOrderByExecutedAtDesc(workspaceId, username, PageRequest.of(0, 50));
    }

    public void logRequest(ApiRequestHistory req) {
        String username = SecurityUtils.getCurrentUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Workspace ws = workspaceRepository.findById(req.getWorkspace().getId())
                .orElseThrow(() -> new RuntimeException("Workspace not found"));

        req.setUser(user);
        req.setWorkspace(ws);

        // Check last entry
        ApiRequestHistory last = historyRepository.findFirstByWorkspaceIdAndUserUsernameOrderByExecutedAtDesc(ws.getId(), username);
        
        if (last != null && isSame(last, req)) {
            last.setExecutedAt(LocalDateTime.now());
            historyRepository.save(last);
        } else {
            req.setExecutedAt(LocalDateTime.now());
            historyRepository.save(req);
        }
    }

    private boolean isSame(ApiRequestHistory a, ApiRequestHistory b) {
        return Objects.equals(a.getMethod(), b.getMethod()) &&
               Objects.equals(a.getUrl(), b.getUrl()) &&
               Objects.equals(a.getHeaders(), b.getHeaders()) &&
               Objects.equals(a.getQueryParams(), b.getQueryParams()) &&
               Objects.equals(a.getBodyType(), b.getBodyType()) &&
               Objects.equals(a.getBodyContent(), b.getBodyContent());
    }
}
