package com.civicvoice.security;

import com.civicvoice.dto.ClerkAuthResponse;
import com.civicvoice.dto.LoginRequest;
import com.civicvoice.dto.UserResponse;
import com.civicvoice.service.UserService;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

/**
 * Single entry point for identity resolution.
 *
 * Accepts two token types in the Authorization: Bearer header:
 *  - Clerk session JWT (verified via JWKS; identity resolved through the Clerk Backend API)
 *  - Civic Voice app session JWT (verified locally with HMAC; issued after a Clerk sign-in)
 *
 * When no Authorization header is present, callers may fall back to legacy
 * query/form parameters (the password-less demo login keeps working).
 */
@Service
public class AuthService {

    private final ClerkTokenVerifier clerkVerifier;
    private final ClerkUserService clerkUsers;
    private final AppSessionService appSessions;
    private final UserService userService;

    public AuthService(ClerkTokenVerifier clerkVerifier,
                       ClerkUserService clerkUsers,
                       AppSessionService appSessions,
                       UserService userService) {
        this.clerkVerifier = clerkVerifier;
        this.clerkUsers = clerkUsers;
        this.appSessions = appSessions;
        this.userService = userService;
    }

    /**
     * @return the signed-in user's email, or empty when no Authorization header is sent
     * @throws SecurityException when a token is present but invalid/expired (HTTP 401)
     */
    public Optional<String> resolveEmail(String authorization) {
        String token = bearerToken(authorization);
        if (token == null) return Optional.empty();
        if (appSessions.isAppToken(token)) {
            Map<String, Object> claims = appSessions.verifyAppToken(token);
            return Optional.of(String.valueOf(claims.get("em")));
        }
        Map<String, Object> claims = clerkVerifier.verify(token);
        String sub = String.valueOf(claims.get("sub"));
        return Optional.of(clerkUsers.fetchProfile(sub, token, claims).email());
    }

    /** Like resolveEmail but requires an identity (HTTP 401 when missing). */
    public String requireEmail(String authorization) {
        return resolveEmail(authorization)
                .orElseThrow(() -> new SecurityException("Sign in required"));
    }

    /**
     * Admin gate: prefers the verified token identity, falls back to the legacy
     * adminEmail parameter used by the demo login.
     */
    public String requireAdmin(String authorization, String legacyAdminEmail) {
        String email = resolveEmail(authorization).orElse(legacyAdminEmail);
        if (email == null || email.isBlank()) {
            throw new SecurityException("Sign in required");
        }
        if (!userService.isAdmin(email)) {
            throw new SecurityException("Unauthorized: admin access required");
        }
        return email;
    }

    /**
     * Exchanges a freshly obtained Clerk session token for a long-lived
     * Civic Voice app session token, upserting the local user row.
     */
    public ClerkAuthResponse clerkLogin(String authorization) {
        String token = bearerToken(authorization);
        if (token == null) throw new SecurityException("Missing Clerk session token");
        Map<String, Object> claims = clerkVerifier.verify(token);
        String sub = String.valueOf(claims.get("sub"));
        ClerkUserService.ClerkProfile profile = clerkUsers.fetchProfile(sub, token, claims);

        UserResponse user = userService.loginOrRegister(new LoginRequest(
                profile.email(), profile.firstName(), profile.lastName(), profile.imageUrl()));
        String appToken = appSessions.issue(
                user.email(), user.firstName(), user.lastName(), user.imageUrl());
        return new ClerkAuthResponse(appToken, user);
    }

    private static String bearerToken(String authorization) {
        if (authorization == null || authorization.isBlank()) return null;
        if (!authorization.regionMatches(true, 0, "Bearer ", 0, 7)) {
            throw new SecurityException("Malformed Authorization header");
        }
        String token = authorization.substring(7).trim();
        if (token.isEmpty()) throw new SecurityException("Empty bearer token");
        return token;
    }
}
