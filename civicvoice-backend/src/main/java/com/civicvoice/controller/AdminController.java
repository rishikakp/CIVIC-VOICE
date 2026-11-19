package com.civicvoice.controller;

import com.civicvoice.dto.AdminOverviewResponse;
import com.civicvoice.security.AuthService;
import com.civicvoice.service.IssueService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class AdminController {

    private final IssueService issueService;
    private final AuthService authService;

    public AdminController(IssueService issueService, AuthService authService) {
        this.issueService = issueService;
        this.authService = authService;
    }

    @GetMapping("/overview")
    public ResponseEntity<AdminOverviewResponse> overview(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(required = false) String adminEmail) {
        authService.requireAdmin(authorization, adminEmail);
        return ResponseEntity.ok(issueService.overview());
    }
}
