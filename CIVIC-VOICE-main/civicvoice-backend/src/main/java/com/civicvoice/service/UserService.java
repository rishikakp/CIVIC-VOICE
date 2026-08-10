package com.civicvoice.service;

import com.civicvoice.dto.LoginRequest;
import com.civicvoice.dto.UserResponse;
import com.civicvoice.model.User;
import com.civicvoice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final Set<String> adminEmails;

    public UserService(UserRepository userRepository,
                       @Value("${app.admin-emails:}") String adminEmailsRaw) {
        this.userRepository = userRepository;
        this.adminEmails = new HashSet<>();
        Arrays.stream(adminEmailsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toLowerCase)
                .forEach(this.adminEmails::add);
    }

    public boolean isAdmin(String email) {
        return email != null && adminEmails.contains(email.toLowerCase());
    }

    @Transactional
    public UserResponse loginOrRegister(LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseGet(User::new);
        user.setEmail(email);
        if (req.firstName() != null && !req.firstName().isBlank()) user.setFirstName(req.firstName().trim());
        if (req.lastName() != null && !req.lastName().isBlank()) user.setLastName(req.lastName().trim());
        if (req.imageUrl() != null && !req.imageUrl().isBlank()) user.setImageUrl(req.imageUrl().trim());
        user = userRepository.save(user);
        return toResponse(user);
    }

    public UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getImageUrl(),
                isAdmin(user.getEmail()),
                user.getCreatedAt()
        );
    }
}
