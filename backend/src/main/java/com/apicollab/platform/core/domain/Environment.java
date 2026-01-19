package com.apicollab.platform.core.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "environments")
public class Environment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Lob
    @Column(columnDefinition = "longtext")
    private String variables; // JSON string: [{"key": "baseUrl", "value": "..."}]

    @Lob
    @Column(columnDefinition = "longtext")
    private String authConfigs; // JSON string: Map<String, OAuth2Config>

    @ManyToOne
    @JoinColumn(name = "workspace_id", nullable = false)
    @JsonIgnoreProperties({"owner", "sharedUsers", "apiDefinitions", "environments"})
    private Workspace workspace;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}