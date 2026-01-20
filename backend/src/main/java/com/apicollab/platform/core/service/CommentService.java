package com.apicollab.platform.core.service;

import com.apicollab.platform.auth.domain.User;
import com.apicollab.platform.auth.repository.UserRepository;
import com.apicollab.platform.common.SecurityUtils;
import com.apicollab.platform.core.domain.ApiDefinition;
import com.apicollab.platform.core.domain.Comment;
import com.apicollab.platform.core.repository.ApiDefinitionRepository;
import com.apicollab.platform.core.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final ApiDefinitionRepository apiDefinitionRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public List<Comment> getComments(Long apiId) {
        return commentRepository.findByApiDefinitionIdOrderByCreatedAtDesc(apiId);
    }

    @Transactional
    public Comment addComment(Long apiId, String content, String fieldPath) {
        ApiDefinition api = apiDefinitionRepository.findById(apiId)
                .orElseThrow(() -> new RuntimeException("API not found"));
        
        String username = SecurityUtils.getCurrentUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Comment comment = Comment.builder()
                .apiDefinition(api)
                .user(user)
                .content(content)
                .fieldPath(fieldPath)
                .build();

        Comment saved = commentRepository.save(comment);
        
        // Notify via WebSocket
        messagingTemplate.convertAndSend("/topic/updates", 
            new UpdateMessage("COMMENT_ADDED", apiId));

        return saved;
    }

    @Transactional
    public void resolveComment(Long id) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        comment.setResolved(true);
        commentRepository.save(comment);
        
        messagingTemplate.convertAndSend("/topic/updates", 
            new UpdateMessage("COMMENT_RESOLVED", comment.getApiDefinition().getId()));
    }

    // Reuse UpdateMessage or create local record
    private record UpdateMessage(String type, Long id) {}
}
