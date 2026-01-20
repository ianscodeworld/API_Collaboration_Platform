package com.apicollab.platform.core.web;

import com.apicollab.platform.core.domain.Comment;
import com.apicollab.platform.core.service.CommentService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/api/{apiId}")
    public ResponseEntity<List<Comment>> getComments(@PathVariable Long apiId) {
        return ResponseEntity.ok(commentService.getComments(apiId));
    }

    @PostMapping("/api/{apiId}")
    public ResponseEntity<Comment> addComment(
            @PathVariable Long apiId, 
            @RequestBody CommentRequest request) {
        return ResponseEntity.ok(commentService.addComment(apiId, request.getContent(), request.getFieldPath()));
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<Void> resolveComment(@PathVariable Long id) {
        commentService.resolveComment(id);
        return ResponseEntity.ok().build();
    }

    @Data
    public static class CommentRequest {
        private String content;
        private String fieldPath;
    }
}
