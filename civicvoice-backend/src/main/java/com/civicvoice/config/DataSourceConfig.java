package com.civicvoice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.net.URI;

/**
 * Builds the DataSource, supporting both:
 *  - local dev (spring.datasource.url = jdbc:postgresql://localhost:5432/civic_voice)
 *  - cloud PaaS (DATABASE_URL in Render/Railway style: postgres://user:pass@host:port/db)
 */
@Configuration
public class DataSourceConfig {

    /**
     * Convert a PaaS-style URL (postgres:// or postgresql://) to a clean
     * jdbc:postgresql:// URL, stripping any embedded credentials so that the
     * explicit username/password properties are used instead (Hikari-safe).
     */
    private static String toCleanJdbcUrl(String url) {
        if (url == null || url.isEmpty()) return url;
        if (url.startsWith("jdbc:")) return url;

        String scheme;
        String rest;
        if (url.startsWith("postgresql://")) {
            scheme = "postgresql";
            rest = url.substring("postgresql://".length());
        } else if (url.startsWith("postgres://")) {
            scheme = "postgresql";
            rest = url.substring("postgres://".length());
        } else {
            return "jdbc:" + url;
        }

        int at = rest.indexOf('@');
        if (at >= 0) {
            rest = rest.substring(at + 1); // strip user:pass@
        }
        return "jdbc:" + scheme + "://" + rest;
    }

    @Bean
    public DataSource dataSource(
            @Value("${DATABASE_URL:#{null}}") String databaseUrl,
            @Value("${DB_URL:}") String dbUrl,
            @Value("${spring.datasource.url:}") String springUrl,
            @Value("${spring.datasource.username:}") String username,
            @Value("${spring.datasource.password:}") String password) {

        String url = toCleanJdbcUrl(databaseUrl != null && !databaseUrl.isEmpty() ? databaseUrl
                : (!dbUrl.isEmpty() ? dbUrl : springUrl));

        DataSourceBuilder<?> builder = DataSourceBuilder.create()
                .driverClassName("org.postgresql.Driver")
                .url(url)
                .username(username)
                .password(password);

        if (databaseUrl != null && !databaseUrl.isEmpty() && databaseUrl.contains("@")) {
            // Parse user:pass from the cloud URL and override the defaults.
            try {
                String rest = databaseUrl.split("://", 2)[1];
                String creds = rest.substring(0, rest.indexOf('@'));
                String[] parts = creds.split(":", 2);
                if (parts.length >= 1) builder.username(parts[0]);
                if (parts.length >= 2) builder.password(parts[1]);
            } catch (Exception ignored) {
                // fall through to explicit username/password
            }
        }

        return builder.build();
    }
}
