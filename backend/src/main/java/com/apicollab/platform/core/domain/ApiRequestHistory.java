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
@Table(name = "api_request_history")
public class ApiRequestHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "workspace_id", nullable = false)
    @JsonIgnoreProperties({"owner", "sharedUsers", "apiDefinitions", "environments"})
    private Workspace workspace;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties("password")
    private User user;

    @ManyToOne
    @JoinColumn(name = "api_definition_id") // Optional link
    @JsonIgnoreProperties({"workspace", "testCases", "versions"})
    private ApiDefinition apiDefinition;

    @Column(nullable = false)
    private String method;

    @Column(nullable = false, columnDefinition = "text")
    private String url;

    @Lob
    @Column(columnDefinition = "longtext")
    private String headers; // JSON

    @Lob
    @Column(columnDefinition = "longtext")
    private String queryParams; // JSON

    private String bodyType;

    @Lob
    @Column(columnDefinition = "longtext")
    private String bodyContent;

    @Column(name = "executed_at")
    private LocalDateTime executedAt;

    @PrePersist
    protected void onCreate() {
        executedAt = LocalDateTime.now();
    }
}
