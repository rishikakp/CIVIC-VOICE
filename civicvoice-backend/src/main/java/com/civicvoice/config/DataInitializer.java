package com.civicvoice.config;

import com.civicvoice.dto.UserResponse;
import com.civicvoice.model.Issue;
import com.civicvoice.model.IssueStatus;
import com.civicvoice.model.Severity;
import com.civicvoice.model.User;
import com.civicvoice.model.Vote;
import com.civicvoice.repository.IssueRepository;
import com.civicvoice.repository.UserRepository;
import com.civicvoice.repository.VoteRepository;
import com.civicvoice.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final IssueRepository issueRepository;
    private final VoteRepository voteRepository;
    private final UserService userService;

    @Value("${app.admin-emails:admin@civicvoice.local}")
    private String adminEmails;

    public DataInitializer(UserRepository userRepository,
                           IssueRepository issueRepository,
                           VoteRepository voteRepository,
                           UserService userService) {
        this.userRepository = userRepository;
        this.issueRepository = issueRepository;
        this.voteRepository = voteRepository;
        this.userService = userService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (true) return; // seeding disabled

        User admin = userRepository.findByEmailIgnoreCase(adminEmails.split(",")[0].trim())
                .orElseGet(User::new);
        admin.setEmail(adminEmails.split(",")[0].trim());
        admin.setFirstName("Admin");
        admin.setLastName("Civic Voice");
        admin = userRepository.save(admin);

        User citizen = userRepository.findByEmailIgnoreCase("citizen@civicvoice.local")
                .orElseGet(User::new);
        citizen.setEmail("citizen@civicvoice.local");
        citizen.setFirstName("Priya");
        citizen.setLastName("Sharma");
        citizen = userRepository.save(citizen);

        User voter = userRepository.findByEmailIgnoreCase("resident@civicvoice.local")
                .orElseGet(User::new);
        voter.setEmail("resident@civicvoice.local");
        voter.setFirstName("Arjun");
        voter.setLastName("Nair");
        voter = userRepository.save(voter);

        List<SeedIssue> seeds = List.of(
                new SeedIssue("Deep pothole on Outer Ring Road near Marathahalli bridge, getting worse every day.",
                        "Roads", Severity.CRITICAL, IssueStatus.SUBMITTED, "Marathahalli, Bengaluru",
                        "12.9569,77.7011", "Marathahalli Outer Ring Road", admin, 6, 12),
                new SeedIssue("Streetlight not working for a week on 4th Main, Indiranagar. Dark stretch at night.",
                        "Streetlights", Severity.MEDIUM, IssueStatus.ASSIGNED, "Indiranagar, Bengaluru",
                        "12.9719,77.6412", "Indiranagar 4th Main", citizen, 0, 3),
                new SeedIssue("Garbage not collected for 5 days near the community park. Stray dogs scattering it.",
                        "Sanitation", Severity.HIGH, IssueStatus.IN_PROGRESS, "Koramangala, Bengaluru",
                        "12.9352,77.6245", "Koramangala 5th Block Park", admin, 1, 8),
                new SeedIssue("Broken manhole cover on the main road, dangerous for two-wheelers.",
                        "Utilities", Severity.CRITICAL, IssueStatus.SUBMITTED, "HSR Layout, Bengaluru",
                        "12.9116,77.6474", "HSR Layout 27th Main", citizen, 0, 11),
                new SeedIssue("Water leakage from main pipe flooding the footpath since Monday.",
                        "Water", Severity.HIGH, IssueStatus.ASSIGNED, "Jayanagar, Bengaluru",
                        "12.9250,77.5938", "Jayanagar 4th Block", citizen, 2, 5),
                new SeedIssue("Open drain overflowing into the street after every rain.",
                        "Sanitation", Severity.MEDIUM, IssueStatus.SUBMITTED, "Bommanahalli, Bengaluru",
                        "12.8986,77.6170", "Bommanahalli Main Road", citizen, 0, 2),
                new SeedIssue("Footpath tiles broken and lifted, wheelchair access impossible.",
                        "Footpaths", Severity.LOW, IssueStatus.RESOLVED, "Malleshwaram, Bengaluru",
                        "13.0066,77.5712", "Malleshwaram 8th Cross", admin, 3, 9),
                new SeedIssue("Illegal dumping of construction waste on vacant plot opposite the school.",
                        "Sanitation", Severity.HIGH, IssueStatus.RESOLVED, "Whitefield, Bengaluru",
                        "12.9698,77.7500", "Whitefield Main Road", admin, 4, 14),
                new SeedIssue("Broken speed breaker on the service road, causing accidents during peak hour.",
                        "Roads", Severity.CRITICAL, IssueStatus.SUBMITTED, "Bellandur, Bengaluru",
                        "12.9299,77.6781", "Bellandur Service Road", citizen, 0, 7),
                new SeedIssue("Pigment spill from nearby factory polluting the lake edge.",
                        "Environment", Severity.MEDIUM, IssueStatus.IN_PROGRESS, "Sarjapur, Bengaluru",
                        "12.8931,77.6965", "Sarjapur Lake", citizen, 0, 4),
                new SeedIssue("No zebra crossing paint near the busy school junction. Kids cross in traffic.",
                        "Roads", Severity.HIGH, IssueStatus.SUBMITTED, "BTM Layout, Bengaluru",
                        "12.9166,77.6101", "BTM Layout 2nd Stage", citizen, 1, 6),
                new SeedIssue("Temporary traffic signal at the junction keeps turning off during rains.",
                        "Traffic", Severity.MEDIUM, IssueStatus.ASSIGNED, "Silk Board, Bengaluru",
                        "12.9166,77.6266", "Silk Board Junction", citizen, 0, 3)
        );

        for (SeedIssue s : seeds) {
            Issue issue = new Issue();
            issue.setDescription(s.description());
            issue.setIssueType(s.issueType());
            issue.setSeverity(s.severity());
            issue.setStatus(s.status());
            issue.setLocation(s.location());
            issue.setCoordinates(s.coordinates());
            issue.setLocationName(s.locationName());
            issue.setUser(s.reporter());
            issue.setCreatedAt(Instant.now().minus(s.daysAgo(), ChronoUnit.DAYS));
            if (s.status() == IssueStatus.ASSIGNED || s.status() == IssueStatus.IN_PROGRESS) {
                issue.setAssignedTo("Field Worker " + (s.daysAgo() % 3 + 1));
            }
            issue = issueRepository.save(issue);

            for (int i = 0; i < s.votes(); i++) {
                Vote vote = new Vote();
                vote.setIssue(issue);
                vote.setCreatedAt(Instant.now().minus(s.daysAgo() + i, ChronoUnit.DAYS));
                voteRepository.save(vote);
            }
        }

        UserResponse adminResp = userService.toResponse(admin);
        System.out.println(">>> Seed complete. Admin login email: " + adminResp.email());
    }

    private record SeedIssue(String description, String issueType, Severity severity,
                             IssueStatus status, String location, String coordinates,
                             String locationName, User reporter, int daysAgo, int votes) {}
}
