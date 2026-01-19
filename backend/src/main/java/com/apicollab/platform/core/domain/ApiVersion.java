package com.apicollab.platform.core.domain;

import com.apicollab.platform.auth.domain.User;
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
@Table(name = "api_versions")
public class ApiVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "api_definition_id", nullable = false)
    @JsonIgnoreProperties({"workspace", "testCases", "versions"})
    private ApiDefinition apiDefinition;

    @ManyToOne
    @JoinColumn(name = "created_by_user_id")
    @JsonIgnoreProperties({"password", "email", "role", "enabled", "authorities", "accountNonExpired", "accountNonLocked", "credentialsNonExpired"})
    private User createdBy;

    @Lob
    @Column(columnDefinition = "longtext")
    private String content; // The snapshot of the API definition content

    private String description; // e.g. "Initial Commit", "Fixed Params"

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
