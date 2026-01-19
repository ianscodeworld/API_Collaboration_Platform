package com.apicollab.platform.common;

import com.apicollab.platform.auth.domain.User;
import com.apicollab.platform.auth.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DebugRunner {

    @Bean
    public CommandLineRunner run(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            System.out.println("--- DEBUG: RESETTING ADMIN ---");
            userRepository.findByUsername("admin").ifPresentOrElse(user -> {
                user.setPassword(passwordEncoder.encode("password"));
                userRepository.save(user);
                System.out.println("Admin password reset to 'password'");
            }, () -> {
                System.out.println("Admin user NOT FOUND - Creating...");
                User admin = User.builder()
                        .username("admin")
                        .email("admin@example.com")
                        .password(passwordEncoder.encode("password"))
                        .role(User.Role.ADMIN)
                        .build();
                userRepository.save(admin);
            });
            System.out.println("------------------------");
        };
    }
}