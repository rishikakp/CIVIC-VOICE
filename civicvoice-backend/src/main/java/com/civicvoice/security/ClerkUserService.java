package com.civicvoice.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Resolves a Clerk user id (sub claim) to a profile using the Clerk Backend API.
 * Falls back to claims embedded in the token when the secret key is not configured.
 */
@Service
public class ClerkUserService {

    private static final Logger log = LoggerFactory.getLogger(ClerkUserService.class);
    private static final long CACHE_TTL_MS = 5 * 60 * 1000L;
    private static final String USERS_URL = "https://api.clerk.com/v1/users/";

    public record ClerkProfile(String email, String firstName, String lastName, String imageUrl) {}

    private record Cached(ClerkProfile profile, long expiresAt) {}

    private final ObjectMapper mapper = new ObjectMapper();
    private final String secretKey;
    private final String frontendApiBase;
    private final Map<String, Cached> cache = new ConcurrentHashMap<>();

    public ClerkUserService(@Value("${app.clerk.secret-key:}") String secretKey,
                            @Value("${app.clerk.publishable-key:}") String publishableKey) {
        this.secretKey = secretKey == null ? "" : secretKey.trim();
        this.frontendApiBase = deriveFrontendApiBase(publishableKey);
        if (this.secretKey.isEmpty()) {
            log.warn("app.clerk.secret-key not set - resolving Clerk profile via the Frontend API instead");
        }
    }

    public boolean isConfigured() {
        return !secretKey.isEmpty();
    }

    public ClerkProfile fetchProfile(String userId, String clerkToken, Map<String, Object> tokenClaims) {
        if (userId == null || !userId.startsWith("user_")) {
            throw new SecurityException("Invalid token subject");
        }
        if (!secretKey.isEmpty()) {
            Cached cached = cache.get(userId);
            long now = System.currentTimeMillis();
            if (cached != null && cached.expiresAt > now) return cached.profile;
            try {
                ClerkProfile profile = callClerkApi(userId);
                cache.put(userId, new Cached(profile, now + CACHE_TTL_MS));
                if (cache.size() > 500) cache.clear();
                return profile;
            } catch (Exception e) {
                log.warn("Clerk Backend API lookup failed ({}); trying the Frontend API",
                        e.getMessage());
            }
        }
        // No usable Backend API key: ask Clerk's Frontend API for the user behind
        // this already-verified session token. This does not require
        // CLERK_SECRET_KEY and returns the same profile fields.
        if (clerkToken != null && !clerkToken.isBlank() && frontendApiBase != null) {
            try {
                return callClerkFrontend(clerkToken, userId);
            } catch (Exception e) {
                log.warn("Clerk Frontend API lookup failed ({}); falling back to token claims",
                        e.getMessage());
            }
        }
        return fromClaims(tokenClaims);
    }

    private ClerkProfile callClerkApi(String userId) {
        try {
            HttpRequest request = HttpRequest.newBuilder(
                            URI.create(USERS_URL + URLEncoder.encode(userId, StandardCharsets.UTF_8)))
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", "Bearer " + secretKey)
                    .header("Accept", "application/json")
                    .GET().build();
            HttpResponse<String> response = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build()
                    .send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 401 || response.statusCode() == 403) {
                throw new IllegalStateException(
                        "Clerk rejected the secret key (HTTP " + response.statusCode() + ")");
            }
            if (response.statusCode() == 404) {
                throw new SecurityException("Clerk user no longer exists");
            }
            if (response.statusCode() != 200) {
                throw new IllegalStateException(
                        "Clerk user lookup failed (HTTP " + response.statusCode() + ")");
            }
            return parseProfile(response.body());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while contacting Clerk", e);
        } catch (SecurityException | IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Unable to reach Clerk: " + e.getMessage(), e);
        }
    }

    /**
     * Resolves the user via Clerk's Frontend API using the session JWT the caller
     * already presented. Works without the Backend API secret key.
     */
    private ClerkProfile callClerkFrontend(String clerkToken, String expectedUserId) {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(frontendApiBase + "/v1/me"))
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", "Bearer " + clerkToken)
                    .header("Accept", "application/json")
                    .GET().build();
            HttpResponse<String> response = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build()
                    .send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 401 || response.statusCode() == 403) {
                throw new SecurityException("Clerk rejected the session token");
            }
            if (response.statusCode() != 200) {
                throw new IllegalStateException(
                        "Clerk Frontend API lookup failed (HTTP " + response.statusCode() + ")");
            }
            JsonNode root = mapper.readTree(response.body());
            JsonNode user = root.has("response") ? root.path("response") : root;
            String id = user.path("id").asText(null);
            if (id != null && !id.isBlank() && !id.equals(expectedUserId)) {
                throw new SecurityException("Clerk user does not match token subject");
            }
            return parseProfile(user);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while contacting Clerk", e);
        } catch (SecurityException | IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Unable to reach Clerk: " + e.getMessage(), e);
        }
    }

    private ClerkProfile parseProfile(String body) throws Exception {
        return parseProfile(mapper.readTree(body));
    }

    private ClerkProfile parseProfile(JsonNode root) {
        String primaryId = root.path("primary_email_address_id").asText(null);
        String email = null;
        for (JsonNode address : root.path("email_addresses")) {
            String value = address.path("email_address").asText(null);
            if (value == null || value.isBlank()) continue;
            if (address.path("id").asText("").equals(primaryId)) {
                email = value;
                break;
            }
            if (email == null) email = value;
        }
        if (email == null || email.isBlank()) {
            throw new IllegalStateException("Clerk user has no email address");
        }
        String imageUrl = textOrNull(root, "image_url");
        if (imageUrl == null) imageUrl = textOrNull(root, "profile_image_url");
        return new ClerkProfile(
                email.trim().toLowerCase(),
                textOrNull(root, "first_name"),
                textOrNull(root, "last_name"),
                imageUrl);
    }

    private static String deriveFrontendApiBase(String publishableKey) {
        if (publishableKey == null || publishableKey.isBlank()) return null;
        String body = publishableKey.trim();
        for (String prefix : new String[]{"pk_test_", "pk_live_", "pk_"}) {
            if (body.startsWith(prefix)) {
                body = body.substring(prefix.length());
                break;
            }
        }
        try {
            String s = body.replace('-', '+').replace('_', '/');
            int pad = (4 - s.length() % 4) % 4;
            StringBuilder sb = new StringBuilder(s);
            for (int i = 0; i < pad; i++) sb.append('=');
            String domain = new String(Base64.getDecoder().decode(sb.toString()), StandardCharsets.UTF_8).trim();
            int dollar = domain.indexOf('$');
            if (dollar >= 0) domain = domain.substring(0, dollar);
            domain = domain.trim();
            if (domain.isEmpty()) return null;
            String base = domain.startsWith("http") ? domain : "https://" + domain;
            return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
        } catch (Exception e) {
            log.warn("Cannot derive Clerk Frontend API origin from publishable key: {}", e.getMessage());
            return null;
        }
    }

    private ClerkProfile fromClaims(Map<String, Object> claims) {
        Object email = claims == null ? null : claims.get("email");
        if (email instanceof String s && !s.isBlank()) {
            return new ClerkProfile(s.trim().toLowerCase(),
                    stringClaim(claims, "firstName"),
                    stringClaim(claims, "lastName"),
                    stringClaim(claims, "imageUrl"));
        }
        throw new IllegalStateException(
                "Unable to resolve the Clerk user's email - the token has no email claim and "
                        + "the Clerk Frontend API lookup failed. Set CLERK_SECRET_KEY on the backend "
                        + "service so the Backend API can be used instead.");
    }

    private static String stringClaim(Map<String, Object> claims, String name) {
        Object value = claims.get(name);
        return value instanceof String s && !s.isBlank() ? s : null;
    }

    private static String textOrNull(JsonNode node, String field) {
        String value = node.path(field).asText(null);
        return value == null || value.isBlank() ? null : value;
    }
}
