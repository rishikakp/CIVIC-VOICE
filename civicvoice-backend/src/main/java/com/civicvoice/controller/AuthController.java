package com.civicvoice.controller;

import com.civicvoice.dto.LoginRequest;
import com.civicvoice.dto.UserResponse;
import com.civicvoice.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.loginOrRegister(request));
    }

    @GetMapping("/admin-check")
    public ResponseEntity<Boolean> adminCheck(@RequestParam String email) {
        return ResponseEntity.ok(userService.isAdmin(email));
    }
}
