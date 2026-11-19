package com.civicvoice.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * Issues and verifies Civic Voice's own long-lived session tokens (HS256).
 * A Clerk session token (60s lifetime) is exchanged for one of these at sign-in,
 * so API calls do not need to talk to Clerk on every request.
 */
@Service
public class AppSessionService {

    private static final Logger log = LoggerFactory.getLogger(AppSessionService.class);
    private static final String ISSUER = "civicvoice";
    private static final String SECRET_FILE = "session.secret";

    private final ObjectMapper mapper = new ObjectMapper();
    private final byte[] secret;
    private final long ttlSeconds;

    public AppSessionService(
            @Value("${app.session.secret:}") String secretProperty,
            @Value("${app.session-ttl-hours:168}") long ttlHours) {
        this.secret = resolveSecret(secretProperty);
        this.ttlSeconds = Math.max(1, ttlHours) * 3600L;
    }

    private static byte[] resolveSecret(String property) {
        if (property != null && !property.isBlank()) {
            return property.trim().getBytes(StandardCharsets.UTF_8);
        }
        Path file = Paths.get(SECRET_FILE);
        try {
            if (Files.exists(file)) {
                String existing = Files.readString(file).trim();
                if (!existing.isEmpty()) return existing.getBytes(StandardCharsets.UTF_8);
            }
            byte[] random = new byte[48];
            new SecureRandom().nextBytes(random);
            String encoded = Base64.getUrlEncoder().withoutPadding().encodeToString(random);
            Files.writeString(file, encoded);
            log.info("Generated session signing secret in {}", file.toAbsolutePath());
            return encoded.getBytes(StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Cannot initialize session secret: " + e.getMessage(), e);
        }
    }

    public String issue(String email, String firstName, String lastName, String imageUrl) {
        try {
            long now = Instant.now().getEpochSecond();
            ObjectNode header = mapper.createObjectNode();
            header.put("alg", "HS256");
            header.put("typ", "JWT");
            ObjectNode payload = mapper.createObjectNode();
            payload.put("iss", ISSUER);
            payload.put("sub", email);
            payload.put("em", email);
            if (firstName != null) payload.put("fn", firstName);
            if (lastName != null) payload.put("ln", lastName);
            if (imageUrl != null) payload.put("img", imageUrl);
            payload.put("iat", now);
            payload.put("exp", now + ttlSeconds);

            String signingInput = b64url(header.toString().getBytes(StandardCharsets.UTF_8))
                    + "." + b64url(payload.toString().getBytes(StandardCharsets.UTF_8));
            byte[] signature = hmac(signingInput.getBytes(StandardCharsets.US_ASCII));
            return signingInput + "." + b64url(signature);
        } catch (Exception e) {
            throw new IllegalStateException("Cannot issue session token: " + e.getMessage(), e);
        }
    }

    /** Cheap check: does this look like one of our tokens (before choosing a verifier)? */
    public boolean isAppToken(String token) {
        try {
            String[] parts = token.split("\\.", -1);
            if (parts.length != 3) return false;
            JsonNode payload = mapper.readTree(ClerkTokenVerifier.base64UrlDecode(parts[1]));
            return ISSUER.equals(payload.path("iss").asText(""));
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * @throws SecurityException when the token is invalid or expired (maps to HTTP 401)
     */
    public Map<String, Object> verifyAppToken(String token) {
        String[] parts = token.split("\\.", -1);
        if (parts.length != 3) throw new SecurityException("Malformed session token");
        byte[] provided;
        try {
            provided = ClerkTokenVerifier.base64UrlDecode(parts[2]);
        } catch (Exception e) {
            throw new SecurityException("Malformed session token");
        }
        String signingInput = parts[0] + "." + parts[1];
        byte[] expected = hmac(signingInput.getBytes(StandardCharsets.US_ASCII));
        if (!MessageDigest.isEqual(expected, provided)) {
            throw new SecurityException("Invalid session token");
        }
        JsonNode payload;
        try {
            payload = mapper.readTree(ClerkTokenVerifier.base64UrlDecode(parts[1]));
        } catch (Exception e) {
            throw new SecurityException("Malformed session token");
        }
        if (!ISSUER.equals(payload.path("iss").asText(""))) {
            throw new SecurityException("Invalid session token issuer");
        }
        long now = Instant.now().getEpochSecond();
        if (now > payload.path("exp").asLong(0)) {
            throw new SecurityException("Session expired, please sign in again");
        }
        String email = payload.path("em").asText(null);
        if (email == null || email.isBlank()) throw new SecurityException("Session token missing email");
        Map<String, Object> claims = new HashMap<>();
        payload.fields().forEachRemaining(entry -> claims.put(entry.getKey(),
                mapper.convertValue(entry.getValue(), Object.class)));
        return claims;
    }

    private byte[] hmac(byte[] data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return mac.doFinal(data);
        } catch (Exception e) {
            throw new IllegalStateException("HMAC failure: " + e.getMessage(), e);
        }
    }

    private static String b64url(byte[] data) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(data);
    }
}
