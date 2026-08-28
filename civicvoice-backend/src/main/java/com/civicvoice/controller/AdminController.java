package com.civicvoice.controller;

import com.civicvoice.dto.AdminOverviewResponse;
import com.civicvoice.service.IssueService;
import com.civicvoice.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
public class AdminController {

    private final IssueService issueService;
    private final UserService userService;

    public AdminController(IssueService issueService, UserService userService) {
        this.issueService = issueService;
        this.userService = userService;
    }

    @GetMapping("/overview")
    public ResponseEntity<AdminOverviewResponse> overview(@RequestParam String adminEmail) {
        requireAdmin(adminEmail);
        return ResponseEntity.ok(issueService.overview());
    }

    private void requireAdmin(String adminEmail) {
        if (!userService.isAdmin(adminEmail)) {
            throw new SecurityException("Unauthorized: admin access required");
        }
    }
}
