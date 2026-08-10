-- Civic Voice - database setup script
-- Run as postgres superuser:  psql -U postgres -h localhost -f setup-db.sql

CREATE DATABASE civicvoice;
GRANT ALL PRIVILEGES ON DATABASE civicvoice TO postgres;

-- Tables are created automatically by Hibernate on first app start.
-- Logical schema reference (see README):
--
-- users  (id uuid PK, email unique, first_name, last_name, image_url, created_at, updated_at)
-- issues (id uuid PK, description text, issue_type, severity, status, assigned_to,
--         location, coordinates, location_name, image_url, created_at, user_id FK)
-- votes  (id uuid PK, issue_id FK cascade, created_at)
