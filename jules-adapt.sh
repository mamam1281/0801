#!/bin/bash
# Use this file to adapt your project for Jules CI environment

echo "====== Adapting Docker configuration for Jules environment ======"

# Create a Jules-specific docker-compose override
cat > docker-compose.override.jules.yml << EOF
version: '3.8'

services:
  backend:
    environment:
      - PYTHONUNBUFFERED=1
      - ENVIRONMENT=test
      - LOG_LEVEL=DEBUG
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 10s

  frontend:
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 10s

  postgres:
    command: postgres -c 'max_connections=200'
    environment:
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
      - POSTGRES_USER=\${POSTGRES_USER}
      - POSTGRES_DB=\${POSTGRES_DB}
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "\${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 10s

  redis:
    command: redis-server --requirepass \${REDIS_PASSWORD}
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "\${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 5s

  # Reduced resource settings for all services in Jules environment
  # This helps with performance in CI environment
  _template: &reduced_resources
    mem_limit: 512m
    mem_reservation: 128m
    cpus: 0.5

  backend:
    <<: *reduced_resources

  frontend:
    <<: *reduced_resources

  postgres:
    <<: *reduced_resources

  redis:
    <<: *reduced_resources
EOF

# Create a setup file specifically for Jules postgres initialization
cat > data/init/00-jules-setup.sql << EOF
-- Jules environment database setup
-- This creates necessary extensions and initial schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Ensure test user exists with correct permissions
DO
\$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${POSTGRES_USER}') THEN
        CREATE ROLE ${POSTGRES_USER} WITH LOGIN PASSWORD '${POSTGRES_PASSWORD}' SUPERUSER;
    END IF;
END
\$\$;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_USER};
EOF

echo "====== Jules adaptation complete ======"
echo "Use './docker-manage.sh start' to start services with Jules configuration"
