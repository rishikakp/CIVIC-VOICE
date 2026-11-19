package com.civicvoice.controller;

import com.civicvoice.dto.ClerkAuthResponse;
import com.civicvoice.dto.LoginRequest;
import com.civicvoice.dto.UserResponse;
import com.civicvoice.security.AuthService;
import com.civicvoice.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    private final UserService userService;
    private final AuthService authService;

    public AuthController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    /** Password-less demo login (kept for backwards compatibility). */
    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.loginOrRegister(request));
    }

    /**
     * Clerk sign-in completion. The frontend sends a fresh Clerk session JWT as
     * Authorization: Bearer &lt;clerk-token&gt;; the backend verifies it, loads the
     * profile from the Clerk Backend API, upserts the local user and returns a
     * long-lived Civic Voice session token.
     */
    @PostMapping("/clerk")
    public ResponseEntity<ClerkAuthResponse> clerkLogin(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(authService.clerkLogin(authorization));
    }

    /** Identity of the current bearer token, if any (Clerk or app session). */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        String email = authService.requireEmail(authorization);
        return ResponseEntity.ok(userService.findByEmail(email));
    }

    @GetMapping("/admin-check")
    public ResponseEntity<Boolean> adminCheck(@RequestParam String email) {
        return ResponseEntity.ok(userService.isAdmin(email));
    }
}
