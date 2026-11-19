package com.civicvoice.controller;

import com.civicvoice.dto.AssignRequest;
import com.civicvoice.dto.IssuePageResponse;
import com.civicvoice.dto.IssueResponse;
import com.civicvoice.dto.StatusRequest;
import com.civicvoice.security.AuthService;
import com.civicvoice.service.IssueService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/issues")
@CrossOrigin
public class IssueController {

    private final IssueService issueService;
    private final AuthService authService;

    public IssueController(IssueService issueService, AuthService authService) {
        this.issueService = issueService;
        this.authService = authService;
    }

    @GetMapping
    public IssuePageResponse list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String queue,
            @RequestParam(required = false) String area,
            @RequestParam(required = false) String email,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "12") int pageSize) {
        return issueService.list(q, status, severity, type, queue, area, email, page, pageSize);
    }

    @GetMapping("/mine")
    public IssuePageResponse mine(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(required = false) String email,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        String owner = authService.resolveEmail(authorization).orElse(email);
        if (owner == null || owner.isBlank()) {
            throw new SecurityException("Sign in required");
        }
        return issueService.list(null, null, null, null, null, null, owner, page, pageSize);
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<IssueResponse> create(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam("description") String description,
            @RequestParam("issueType") String issueType,
            @RequestParam("severity") String severity,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String coordinates,
            @RequestParam(required = false) String locationName,
            @RequestParam(required = false) String email,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        String reporter = authService.resolveEmail(authorization).orElse(email);
        return ResponseEntity.ok(issueService.create(description, issueType, severity,
                location, coordinates, locationName, reporter, image));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<IssueResponse> updateStatus(
            @PathVariable String id,
            @RequestBody StatusRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(required = false) String adminEmail) {
        authService.requireAdmin(authorization, adminEmail);
        return ResponseEntity.ok(issueService.updateStatus(id, request.status()));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<IssueResponse> assign(
            @PathVariable String id,
            @RequestBody AssignRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(required = false) String adminEmail) {
        authService.requireAdmin(authorization, adminEmail);
        return ResponseEntity.ok(issueService.assign(id, request.assignedTo()));
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<Map<String, Object>> vote(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable String id) {
        if (authorization != null && !authorization.isBlank()) {
            authService.requireEmail(authorization);
        }
        long count = issueService.vote(id);
        return ResponseEntity.ok(Map.of("success", true, "voteCount", count));
    }
}
