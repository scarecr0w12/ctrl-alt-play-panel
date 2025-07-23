-- Initial database setup
-- This file will be automatically executed when the PostgreSQL container starts

-- Create the main database if it doesn't exist
-- (This is handled by the POSTGRES_DB environment variable)

-- Create initial location
INSERT INTO locations (id, name, description, created_at, updated_at)
VALUES ('default-location', 'Default Location', 'Default server location', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create initial nest and egg for Minecraft
INSERT INTO nests (id, name, description, created_at, updated_at)
VALUES ('minecraft-nest', 'Minecraft', 'Minecraft game servers', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO eggs (id, name, description, docker_image, startup, nest_id, created_at, updated_at)
VALUES (
    'minecraft-java',
    'Minecraft Java Edition',
    'Minecraft Java Edition server',
    'openjdk:17-alpine',
    'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar nogui',
    'minecraft-nest',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create initial admin user (password: admin123)
-- Note: In production, this should be done through the application with proper password hashing
INSERT INTO users (id, email, username, first_name, last_name, password, role, created_at, updated_at)
VALUES (
    'admin-user',
    'admin@example.com',
    'admin',
    'Admin',
    'User',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj7.w8sZ6V1W', -- admin123
    'ADMIN',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;
