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
    private final Map<String, Cached> cache = new ConcurrentHashMap<>();

    public ClerkUserService(@Value("${app.clerk.secret-key:}") String secretKey) {
        this.secretKey = secretKey == null ? "" : secretKey.trim();
        if (this.secretKey.isEmpty()) {
            log.warn("app.clerk.secret-key not set - Clerk profile lookup falls back to token claims only");
        }
    }

    public ClerkProfile fetchProfile(String userId, Map<String, Object> tokenClaims) {
        if (userId == null || !userId.startsWith("user_")) {
            throw new SecurityException("Invalid token subject");
        }
        if (secretKey.isEmpty()) {
            return fromClaims(tokenClaims);
        }
        Cached cached = cache.get(userId);
        long now = System.currentTimeMillis();
        if (cached != null && cached.expiresAt > now) return cached.profile;

        ClerkProfile profile = callClerkApi(userId);
        cache.put(userId, new Cached(profile, now + CACHE_TTL_MS));
        if (cache.size() > 500) cache.clear();
        return profile;
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
            JsonNode root = mapper.readTree(response.body());
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
            return new ClerkProfile(
                    email.trim().toLowerCase(),
                    textOrNull(root, "first_name"),
                    textOrNull(root, "last_name"),
                    textOrNull(root, "image_url"));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while contacting Clerk", e);
        } catch (SecurityException | IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Unable to reach Clerk: " + e.getMessage(), e);
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
                "CLERK_SECRET_KEY is not configured and the token contains no email claim - "
                        + "set CLERK_SECRET_KEY in .env so the backend can resolve the user's email");
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
