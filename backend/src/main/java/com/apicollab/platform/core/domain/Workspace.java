package com.apicollab.platform.core.domain;

import com.apicollab.platform.auth.domain.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "workspaces")
public class Workspace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @ManyToOne
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true) // Allow null for backward compatibility
    @Builder.Default
    private Type type = Type.TEAM;

    public enum Type {
        PERSONAL,
        TEAM
    }

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "workspace_shares",
        joinColumns = @JoinColumn(name = "workspace_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> sharedUsers;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
