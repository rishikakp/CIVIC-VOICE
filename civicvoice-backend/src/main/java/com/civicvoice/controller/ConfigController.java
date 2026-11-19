package com.civicvoice.controller;

import com.civicvoice.security.ClerkTokenVerifier;
import com.civicvoice.security.ClerkUserService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Read-only build/configuration diagnostics. Returns booleans only (never the
 * secret values) so a deployment can be checked without shell access.
 */
@RestController
@RequestMapping("/api/config")
@CrossOrigin
public class ConfigController {

    private final ClerkTokenVerifier verifier;
    private final ClerkUserService users;

    public ConfigController(ClerkTokenVerifier verifier, ClerkUserService users) {
        this.verifier = verifier;
        this.users = users;
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("clerkPublishableConfigured", verifier.isConfigured());
        body.put("clerkSecretConfigured", users.isConfigured());
        return body;
    }
}
