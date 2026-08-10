package com.civicvoice.controller;

import com.civicvoice.dto.AssignRequest;
import com.civicvoice.dto.IssuePageResponse;
import com.civicvoice.dto.IssueResponse;
import com.civicvoice.dto.StatusRequest;
import com.civicvoice.service.IssueService;
import com.civicvoice.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/issues")
@CrossOrigin
public class IssueController {

    private final IssueService issueService;
    private final UserService userService;

    public IssueController(IssueService issueService, UserService userService) {
        this.issueService = issueService;
        this.userService = userService;
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
    public IssuePageResponse mine(@RequestParam String email,
                                  @RequestParam(defaultValue = "1") int page,
                                  @RequestParam(defaultValue = "10") int pageSize) {
        return issueService.list(null, null, null, null, null, null, email, page, pageSize);
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<IssueResponse> create(
            @RequestParam("description") String description,
            @RequestParam("issueType") String issueType,
            @RequestParam("severity") String severity,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String coordinates,
            @RequestParam(required = false) String locationName,
            @RequestParam(required = false) String email,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        return ResponseEntity.ok(issueService.create(description, issueType, severity,
                location, coordinates, locationName, email, image));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<IssueResponse> updateStatus(
            @PathVariable String id,
            @RequestBody StatusRequest request,
            @RequestParam String adminEmail) {
        requireAdmin(adminEmail);
        return ResponseEntity.ok(issueService.updateStatus(id, request.status()));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<IssueResponse> assign(
            @PathVariable String id,
            @RequestBody AssignRequest request,
            @RequestParam String adminEmail) {
        requireAdmin(adminEmail);
        return ResponseEntity.ok(issueService.assign(id, request.assignedTo()));
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<Map<String, Object>> vote(@PathVariable String id) {
        long count = issueService.vote(id);
        return ResponseEntity.ok(Map.of("success", true, "voteCount", count));
    }

    private void requireAdmin(String adminEmail) {
        if (!userService.isAdmin(adminEmail)) {
            throw new SecurityException("Unauthorized: admin access required");
        }
    }
}
