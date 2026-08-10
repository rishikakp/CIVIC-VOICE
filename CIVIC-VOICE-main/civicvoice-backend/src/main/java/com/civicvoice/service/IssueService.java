package com.civicvoice.service;

import com.civicvoice.dto.AdminOverviewResponse;
import com.civicvoice.dto.IssuePageResponse;
import com.civicvoice.dto.IssueResponse;
import com.civicvoice.model.Issue;
import com.civicvoice.model.IssueStatus;
import com.civicvoice.model.Severity;
import com.civicvoice.model.Vote;
import com.civicvoice.repository.IssueRepository;
import com.civicvoice.repository.UserRepository;
import com.civicvoice.repository.VoteRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class IssueService {

    private static final Set<String> STATUS_FILTERS =
            Set.of("SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED");
    private static final Set<String> SEVERITY_FILTERS =
            Set.of("LOW", "MEDIUM", "HIGH", "CRITICAL");

    private final IssueRepository issueRepository;
    private final VoteRepository voteRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    public IssueService(IssueRepository issueRepository,
                        VoteRepository voteRepository,
                        UserRepository userRepository,
                        StorageService storageService) {
        this.issueRepository = issueRepository;
        this.voteRepository = voteRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
    }

    @Transactional
    public IssueResponse create(String description, String issueType, String severityRaw,
                                String location, String coordinates, String locationName,
                                String email, MultipartFile image) {
        if (description == null || description.isBlank()) throw new IllegalArgumentException("description is required");
        if (issueType == null || issueType.isBlank()) throw new IllegalArgumentException("issueType is required");

        Severity severity;
        try {
            severity = Severity.valueOf(severityRaw == null ? "" : severityRaw.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("valid severity is required: LOW, MEDIUM, HIGH, CRITICAL");
        }

        Issue issue = new Issue();
        issue.setDescription(description.trim());
        issue.setIssueType(issueType.trim());
        issue.setSeverity(severity);
        issue.setStatus(IssueStatus.SUBMITTED);
        issue.setLocation(nullIfBlank(location));
        issue.setCoordinates(nullIfBlank(coordinates));
        issue.setLocationName(nullIfBlank(locationName));
        issue.setImageUrl(storageService.store(image));

        if (email != null && !email.isBlank()) {
            userRepository.findByEmailIgnoreCase(email.trim()).ifPresent(issue::setUser);
        }

        Issue saved = issueRepository.save(issue);
        return IssueResponse.from(saved, 0);
    }

    @Transactional(readOnly = true)
    public IssuePageResponse list(String q, String status, String severity, String type,
                                  String queue, String area, String email,
                                  int page, int pageSize) {
        page = Math.max(1, page);
        pageSize = Math.max(1, Math.min(pageSize, 100));

        Specification<Issue> spec = buildSpecification(q, status, severity, type, queue, area, email);
        Page<Issue> result = issueRepository.findAll(spec,
                PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt")));

        List<IssueResponse> responses = mapWithVotes(result.getContent());
        return new IssuePageResponse(responses, page, pageSize, result.getTotalElements(),
                Math.max(1, result.getTotalPages()), commonAreas());
    }

    @Transactional(readOnly = true)
    public AdminOverviewResponse overview() {
        long total = issueRepository.count();
        long open = countByStatusNot(IssueStatus.RESOLVED);
        long resolved = countByStatus(IssueStatus.RESOLVED);
        long critical = countBySeverity(Severity.CRITICAL);
        long unassigned = countUnassigned();

        List<AdminOverviewResponse.QuickList> quickLists = new ArrayList<>();
        quickLists.add(quickList("unassigned", "Unassigned (latest 5)", specUnassigned()));
        quickLists.add(quickList("critical", "Critical (latest 5)", specSeverity(Severity.CRITICAL)));
        quickLists.add(quickList("in_progress", "In Progress (latest 5)", specStatus(IssueStatus.IN_PROGRESS)));

        return new AdminOverviewResponse(open, resolved, total, critical, unassigned, quickLists, commonAreas());
    }

    @Transactional
    public IssueResponse updateStatus(String id, IssueStatus status) {
        Issue issue = requireIssue(id);
        issue.setStatus(status);
        return IssueResponse.from(issueRepository.save(issue), voteRepository.countByIssueId(id));
    }

    @Transactional
    public IssueResponse assign(String id, String assignedTo) {
        Issue issue = requireIssue(id);
        issue.setAssignedTo(nullIfBlank(assignedTo));
        return IssueResponse.from(issueRepository.save(issue), voteRepository.countByIssueId(id));
    }

    @Transactional
    public long vote(String id) {
        requireIssue(id);
        Vote vote = new Vote();
        vote.setIssue(issueRepository.getReferenceById(id));
        voteRepository.save(vote);
        return voteRepository.countByIssueId(id);
    }

    private Specification<Issue> buildSpecification(String q, String status, String severity, String type,
                                                    String queue, String area, String email) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (email != null && !email.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("user").get("email")), email.trim().toLowerCase()));
            }
            if (status != null && STATUS_FILTERS.contains(status)) {
                predicates.add(cb.equal(root.get("status"), IssueStatus.valueOf(status)));
            }
            if (severity != null && SEVERITY_FILTERS.contains(severity)) {
                predicates.add(cb.equal(root.get("severity"), Severity.valueOf(severity)));
            }
            if (type != null && !type.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("issueType")), type.trim().toLowerCase()));
            }
            if (area != null && !area.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("locationName")), "%" + area.trim().toLowerCase() + "%"));
            }
            if (queue != null && !queue.isBlank()) {
                switch (queue) {
                    case "unassigned" -> predicates.add(cb.isNull(root.get("assignedTo")));
                    case "critical" -> predicates.add(cb.equal(root.get("severity"), Severity.CRITICAL));
                    case "stale" -> predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"),
                            Instant.now().minus(7, ChronoUnit.DAYS)));
                    default -> { }
                }
            }
            if (q != null && !q.isBlank()) {
                String pattern = "%" + q.trim().toLowerCase() + "%";
                Predicate desc = cb.like(cb.lower(root.get("description")), pattern);
                Predicate loc = cb.like(cb.lower(root.get("location")), pattern);
                Predicate locName = cb.like(cb.lower(root.get("locationName")), pattern);
                Predicate coords = cb.like(cb.lower(root.get("coordinates")), pattern);
                Predicate id = cb.like(root.get("id"), pattern);
                Predicate idEnds = cb.like(root.get("id"), pattern);

                Root<com.civicvoice.model.User> userRoot = query.from(com.civicvoice.model.User.class);
                Predicate userEmail = cb.like(cb.lower(userRoot.get("email")), pattern);
                Predicate userFirst = cb.like(cb.lower(userRoot.get("firstName")), pattern);
                Predicate userLast = cb.like(cb.lower(userRoot.get("lastName")), pattern);
                Predicate userMatch = cb.and(cb.equal(userRoot.get("id"), root.get("user").get("id")),
                        cb.or(userEmail, userFirst, userLast));

                predicates.add(cb.or(desc, loc, locName, coords, id, idEnds, userMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private long countByStatus(IssueStatus status) {
        return issueRepository.count((root, query, cb) -> cb.equal(root.get("status"), status));
    }

    private long countByStatusNot(IssueStatus status) {
        return issueRepository.count((root, query, cb) -> cb.notEqual(root.get("status"), status));
    }

    private long countBySeverity(Severity severity) {
        return issueRepository.count((root, query, cb) -> cb.equal(root.get("severity"), severity));
    }

    private long countUnassigned() {
        return issueRepository.count((root, query, cb) -> cb.isNull(root.get("assignedTo")));
    }

    private Specification<Issue> specUnassigned() {
        return (root, query, cb) -> cb.isNull(root.get("assignedTo"));
    }

    private Specification<Issue> specSeverity(Severity severity) {
        return (root, query, cb) -> cb.equal(root.get("severity"), severity);
    }

    private Specification<Issue> specStatus(IssueStatus status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    private AdminOverviewResponse.QuickList quickList(String key, String title, Specification<Issue> spec) {
        List<Issue> rows = issueRepository.findAll(spec,
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();
        return new AdminOverviewResponse.QuickList(key, title, mapWithVotes(rows));
    }

    private List<IssueResponse> mapWithVotes(List<Issue> issues) {
        if (issues.isEmpty()) return List.of();
        List<String> ids = issues.stream().map(Issue::getId).collect(Collectors.toList());
        Map<String, Long> counts = new HashMap<>();
        for (Object[] row : voteRepository.countByIssueIds(ids)) {
            counts.put((String) row[0], ((Number) row[1]).longValue());
        }
        return issues.stream()
                .map(i -> IssueResponse.from(i, counts.getOrDefault(i.getId(), 0L)))
                .collect(Collectors.toList());
    }

    private List<String> commonAreas() {
        Set<String> areas = new LinkedHashSet<>();
        for (String name : issueRepository.findDistinctLocationNames()) {
            if (name == null) continue;
            for (String part : name.split(",")) {
                if (!part.trim().isEmpty()) {
                    areas.add(part.trim());
                    break;
                }
            }
        }
        return List.copyOf(areas);
    }

    private Issue requireIssue(String id) {
        return issueRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Issue not found: " + id));
    }

    private String nullIfBlank(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
