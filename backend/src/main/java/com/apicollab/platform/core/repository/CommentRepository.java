package com.apicollab.platform.core.repository;

import com.apicollab.platform.core.domain.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByApiDefinitionIdOrderByCreatedAtDesc(Long apiId);
}
