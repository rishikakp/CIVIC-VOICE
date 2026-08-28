package com.civicvoice.dto;

import com.civicvoice.model.Issue;
import com.civicvoice.model.IssueStatus;
import com.civicvoice.model.Severity;

import java.time.Instant;

public record IssueResponse(
        String id,
        String description,
        String issueType,
        Severity severity,
        IssueStatus status,
        String assignedTo,
        String location,
        String coordinates,
        String locationName,
        String imageUrl,
        Instant createdAt,
        long voteCount,
        String shortId,
        String mainArea,
        String reporterEmail,
        String reporterName
) {
    public static IssueResponse from(Issue issue, long voteCount) {
        String reporterName = null;
        String reporterEmail = null;
        if (issue.getUser() != null) {
            reporterEmail = issue.getUser().getEmail();
            reporterName = (issue.getUser().getFirstName() == null ? "" : issue.getUser().getFirstName())
                    + (issue.getUser().getLastName() == null ? "" : " " + issue.getUser().getLastName());
            reporterName = reporterName.isBlank() ? null : reporterName.trim();
        }
        return new IssueResponse(
                issue.getId(),
                issue.getDescription(),
                issue.getIssueType(),
                issue.getSeverity(),
                issue.getStatus(),
                issue.getAssignedTo(),
                issue.getLocation(),
                issue.getCoordinates(),
                issue.getLocationName(),
                issue.getImageUrl(),
                issue.getCreatedAt(),
                voteCount,
                shortId(issue.getId()),
                mainArea(issue),
                reporterEmail,
                reporterName
        );
    }

    public static String shortId(String id) {
        return id == null ? "" : id.replace("-", "");
    }

    public static String mainArea(Issue issue) {
        String loc = issue.getLocationName() != null ? issue.getLocationName()
                : issue.getLocation() != null ? issue.getLocation()
                : issue.getCoordinates();
        if (loc == null || loc.isBlank()) return null;
        for (String part : loc.split(",")) {
            if (!part.trim().isEmpty()) return part.trim();
        }
        return loc.trim();
    }
}
