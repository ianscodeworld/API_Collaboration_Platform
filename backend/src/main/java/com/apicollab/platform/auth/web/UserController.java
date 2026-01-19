package com.apicollab.platform.auth.web;

import com.apicollab.platform.auth.domain.User;
import com.apicollab.platform.auth.repository.UserRepository;
import com.apicollab.platform.auth.service.AuthenticationService;
import com.apicollab.platform.auth.web.dto.AuthenticationResponse;
import com.apicollab.platform.auth.web.dto.RegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.apicollab.platform.auth.web.dto.UpdateRoleRequest;
import com.apicollab.platform.auth.web.dto.UserCreationResponse;
import com.apicollab.platform.common.DuplicateResourceException;
import com.apicollab.platform.common.PhraseGenerator;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<UserCreationResponse> createUser(@RequestBody RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new DuplicateResourceException("Username '" + request.getUsername() + "' already exists");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new DuplicateResourceException("Email '" + request.getEmail() + "' already exists");
        }

        User.Role role = User.Role.EDITOR;
        if (request.getRole() != null) {
            try {
                role = User.Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {}
        }

        // Generate simple phrase password
        String rawPassword = PhraseGenerator.generate();

        var user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(rawPassword))
                .role(role)
                .mustChangePassword(true)
                .build();
        
        User savedUser = userRepository.save(user);
        
        return ResponseEntity.ok(UserCreationResponse.builder()
                .user(savedUser)
                .rawPassword(rawPassword)
                .build());
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<User> updateUserRole(@PathVariable Long id, @RequestBody UpdateRoleRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        try {
            user.setRole(User.Role.valueOf(request.getRole().toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role");
        }
        return ResponseEntity.ok(userRepository.save(user));
    }

    @DeleteMapping("/{username}")
    public ResponseEntity<Void> deleteUser(@PathVariable String username) {
        userRepository.findByUsername(username).ifPresent(userRepository::delete);
        return ResponseEntity.noContent().build();
    }
}
