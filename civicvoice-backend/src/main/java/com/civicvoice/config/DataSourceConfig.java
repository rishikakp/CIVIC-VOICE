package com.civicvoice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/**
 * Builds the DataSource, supporting both:
 *  - local dev (spring.datasource.url = jdbc:postgresql://localhost:5432/civic_voice)
 *  - cloud PaaS (DATABASE_URL in Render/Railway style: postgresql://user:pass@host:port/db)
 */
@Configuration
public class DataSourceConfig {

    private static String toJdbcUrl(String url) {
        if (url == null || url.isEmpty()) return url;
        if (url.startsWith("jdbc:")) return url;
        // Convert postgresql:// or postgres:// to the jdbc:postgresql:// scheme the
        // PostgreSQL JDBC driver requires.
        if (url.startsWith("postgres://")) {
            return "jdbc:postgresql://" + url.substring("postgres://".length());
        }
        if (url.startsWith("postgresql://")) {
            return "jdbc:postgresql://" + url.substring("postgresql://".length());
        }
        return "jdbc:" + url;
    }

    @Bean
    public DataSource dataSource(
            @Value("${DATABASE_URL:#{null}}") String databaseUrl,
            @Value("${DB_URL:}") String dbUrl,
            @Value("${spring.datasource.url:}") String springUrl,
            @Value("${spring.datasource.username:}") String username,
            @Value("${spring.datasource.password:}") String password) {

        String url = toJdbcUrl(databaseUrl != null && !databaseUrl.isEmpty() ? databaseUrl
                : (!dbUrl.isEmpty() ? dbUrl : springUrl));

        DataSourceBuilder<?> builder = DataSourceBuilder.create()
                .driverClassName("org.postgresql.Driver");

        if (databaseUrl != null && !databaseUrl.isEmpty() && databaseUrl.contains("@")) {
            // Parse user:pass from URL if present
            try {
                String rest = databaseUrl.split("://", 2)[1];
                String creds = rest.substring(0, rest.indexOf('@'));
                String[] parts = creds.split(":");
                builder.username(parts[0]);
                if (parts.length > 1) builder.password(parts[1]);
            } catch (Exception ignored) {
                // fall through to explicit username/password
            }
        } else {
            builder.username(username).password(password);
        }

        return builder.url(url).build();
    }
}
