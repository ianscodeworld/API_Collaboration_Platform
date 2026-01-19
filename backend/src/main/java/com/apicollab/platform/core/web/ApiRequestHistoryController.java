package com.apicollab.platform.core.web;

import com.apicollab.platform.core.domain.ApiRequestHistory;
import com.apicollab.platform.core.service.ApiRequestHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/history")
@RequiredArgsConstructor
public class ApiRequestHistoryController {

    private final ApiRequestHistoryService historyService;

    @GetMapping("/workspace/{workspaceId}")
    public ResponseEntity<List<ApiRequestHistory>> getHistory(@PathVariable Long workspaceId) {
        return ResponseEntity.ok(historyService.getHistory(workspaceId));
    }

    @PostMapping
    public ResponseEntity<Void> logRequest(@RequestBody ApiRequestHistory history) {
        historyService.logRequest(history);
        return ResponseEntity.ok().build();
    }
}
