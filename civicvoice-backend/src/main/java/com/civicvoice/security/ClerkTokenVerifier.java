package com.civicvoice.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigInteger;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.RSAPublicKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Verifies Clerk session JWTs (RS256) against the instance JWKS.
 * The issuer and JWKS URL are derived from the publishable key.
 */
@Component
public class ClerkTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(ClerkTokenVerifier.class);
    private static final long CLOCK_SKEW_SECONDS = 60;
    private static final long JWKS_TTL_MS = 10 * 60 * 1000L;
    private static final long UNKNOWN_KID_REFRESH_MIN_INTERVAL_MS = 30_000L;

    private final ObjectMapper mapper = new ObjectMapper();
    private final String publishableKey;

    private volatile String issuer;
    private volatile String jwksUrl;
    private volatile Map<String, PublicKey> keys = Map.of();
    private volatile long keysFetchedAtMs;
    private final AtomicLong lastForcedRefreshMs = new AtomicLong(0);

    public ClerkTokenVerifier(@Value("${app.clerk.publishable-key:}") String publishableKey) {
        this.publishableKey = publishableKey == null ? "" : publishableKey.trim();
        if (!this.publishableKey.isEmpty()) {
            deriveEndpoints();
        } else {
            log.warn("app.clerk.publishable-key not set - Clerk sign-in verification is disabled");
        }
    }

    public boolean isConfigured() {
        return issuer != null;
    }

    private synchronized void deriveEndpoints() {
        if (issuer != null) return;
        String body = publishableKey;
        for (String prefix : new String[]{"pk_test_", "pk_live_", "pk_"}) {
            if (body.startsWith(prefix)) {
                body = body.substring(prefix.length());
                break;
            }
        }
        try {
            byte[] decoded = base64UrlDecode(body);
            String domain = new String(decoded, StandardCharsets.UTF_8).trim();
            int dollar = domain.indexOf('$');
            if (dollar >= 0) domain = domain.substring(0, dollar);
            domain = domain.trim();
            if (domain.isEmpty()) throw new IllegalArgumentException("empty");
            String base = domain.startsWith("http") ? domain : "https://" + domain;
            if (base.endsWith("/")) base = base.substring(0, base.length() - 1);
            this.issuer = base;
            this.jwksUrl = base + "/.well-known/jwks.json";
            log.info("Clerk verification enabled: issuer={}", issuer);
        } catch (Exception e) {
            throw new IllegalStateException(
                    "Cannot derive Clerk issuer from publishable key: " + publishableKey, e);
        }
    }

    /**
     * Verifies signature + standard claims. Returns the JWT claims as a map.
     *
     * @throws SecurityException     when the token is invalid/expired (maps to HTTP 401)
     * @throws IllegalStateException when verification is unavailable (config/network) (maps to HTTP 500)
     */
    public Map<String, Object> verify(String jwt) {
        if (!isConfigured()) {
            throw new IllegalStateException(
                    "Clerk is not configured (set CLERK_PUBLISHABLE_KEY / app.clerk.publishable-key)");
        }
        if (jwt == null || jwt.isBlank()) throw new SecurityException("Empty token");
        String[] parts = jwt.split("\\.", -1);
        if (parts.length != 3) throw new SecurityException("Malformed token");

        JsonNode header;
        try {
            header = mapper.readTree(base64UrlDecode(parts[0]));
        } catch (Exception e) {
            throw new SecurityException("Malformed token header");
        }
        if (!"RS256".equals(header.path("alg").asText())) {
            throw new SecurityException("Unsupported token algorithm");
        }
        String kid = header.path("kid").asText(null);
        if (kid == null || kid.isBlank()) throw new SecurityException("Token missing key id");

        PublicKey key = resolveKey(kid);
        byte[] signingInput = (parts[0] + "." + parts[1]).getBytes(StandardCharsets.US_ASCII);
        byte[] signature;
        try {
            signature = base64UrlDecode(parts[2]);
        } catch (Exception e) {
            throw new SecurityException("Malformed token signature");
        }
        try {
            Signature verifier = Signature.getInstance("SHA256withRSA");
            verifier.initVerify(key);
            verifier.update(signingInput);
            if (!verifier.verify(signature)) throw new SecurityException("Invalid token signature");
        } catch (SecurityException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Signature verification failed: " + e.getMessage(), e);
        }

        JsonNode payload;
        try {
            payload = mapper.readTree(base64UrlDecode(parts[1]));
        } catch (Exception e) {
            throw new SecurityException("Malformed token payload");
        }
        if (!issuer.equals(payload.path("iss").asText(""))){
            throw new SecurityException("Invalid token issuer");
        }
        long now = Instant.now().getEpochSecond();
        if (payload.has("exp") && now > payload.get("exp").asLong() + CLOCK_SKEW_SECONDS) {
            throw new SecurityException("Token expired");
        }
        if (payload.has("nbf") && now + CLOCK_SKEW_SECONDS < payload.get("nbf").asLong()) {
            throw new SecurityException("Token not valid yet");
        }
        if (payload.path("sub").asText(null) == null || payload.path("sub").asText().isBlank()) {
            throw new SecurityException("Token missing subject");
        }
        Map<String, Object> claims = new HashMap<>();
        payload.fields().forEachRemaining(entry -> claims.put(entry.getKey(),
                mapper.convertValue(entry.getValue(), Object.class)));
        return claims;
    }

    private PublicKey resolveKey(String kid) {
        PublicKey key = keys.get(kid);
        if (key != null) return key;
        refreshKeys(true);
        key = keys.get(kid);
        if (key == null) throw new SecurityException("Token signing key not recognized");
        return key;
    }

    private synchronized void refreshKeys(boolean unknownKidTrigger) {
        long now = System.currentTimeMillis();
        if (now - keysFetchedAtMs < JWKS_TTL_MS && !unknownKidTrigger) return;
        long lastForced = lastForcedRefreshMs.get();
        if (unknownKidTrigger && now - lastForced < UNKNOWN_KID_REFRESH_MIN_INTERVAL_MS && !keys.isEmpty()) return;
        if (unknownKidTrigger) lastForcedRefreshMs.set(now);

        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(jwksUrl))
                    .timeout(Duration.ofSeconds(10))
                    .header("Accept", "application/json")
                    .GET().build();
            HttpResponse<String> response = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build()
                    .send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new IllegalStateException("JWKS endpoint returned HTTP " + response.statusCode());
            }
            Map<String, PublicKey> parsed = parseJwks(response.body());
            if (parsed.isEmpty()) throw new IllegalStateException("JWKS contains no usable keys");
            this.keys = parsed;
            this.keysFetchedAtMs = now;
            log.debug("Refreshed Clerk JWKS: {} keys", parsed.size());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while fetching Clerk keys", e);
        } catch (IllegalStateException e) {
            this.keysFetchedAtMs = now;
            if (keys.isEmpty()) throw e;
            log.warn("JWKS refresh failed, using cached keys: {}", e.getMessage());
        } catch (Exception e) {
            this.keysFetchedAtMs = now;
            if (keys.isEmpty()) {
                throw new IllegalStateException("Unable to fetch Clerk signing keys: " + e.getMessage(), e);
            }
            log.warn("JWKS refresh failed, using cached keys: {}", e.getMessage());
        }
    }

    private Map<String, PublicKey> parseJwks(String body) throws Exception {
        JsonNode array = mapper.readTree(body).path("keys");
        Map<String, PublicKey> parsed = new HashMap<>();
        for (JsonNode node : array) {
            if (!"RSA".equals(node.path("kty").asText())) continue;
            String use = node.path("use").asText("sig");
            if (!"sig".equals(use)) continue;
            String alg = node.path("alg").asText("RS256");
            if (!"RS256".equals(alg)) continue;
            String kid = node.path("kid").asText(null);
            if (kid == null || kid.isBlank()) continue;
            BigInteger modulus = new BigInteger(1, base64UrlDecode(node.path("n").asText()));
            BigInteger exponent = new BigInteger(1, base64UrlDecode(node.path("e").asText()));
            PublicKey key = KeyFactory.getInstance("RSA")
                    .generatePublic(new RSAPublicKeySpec(modulus, exponent));
            parsed.put(kid, key);
        }
        return parsed;
    }

    static byte[] base64UrlDecode(String input) {
        String s = input.replace('-', '+').replace('_', '/');
        int pad = (4 - s.length() % 4) % 4;
        StringBuilder sb = new StringBuilder(s);
        for (int i = 0; i < pad; i++) sb.append('=');
        return Base64.getDecoder().decode(sb.toString());
    }
}
