# This file includes fixes for common Jules environment issues

# Fix for Docker socket permissions
# The Jules environment may restrict Docker socket access
if [ ! -z "$JULES_RUNNING" ]; then
  # Fix Docker socket permissions if needed
  if ! docker ps &>/dev/null; then
    echo "Fixing Docker socket permissions..."
    sudo chmod 666 /var/run/docker.sock 2>/dev/null || echo "Could not fix Docker socket permissions"
  fi
fi

# Fix for Node.js memory issues in restricted environments
export NODE_OPTIONS="--max-old-space-size=2048"

# Fix for PostgreSQL connection issues
export PGHOST=localhost
export PGUSER=${POSTGRES_USER:-cc_user}
export PGPASSWORD=${POSTGRES_PASSWORD:-cc_password}
export PGDATABASE=${POSTGRES_DB:-cc_webapp}

# Fix for Redis connection issues in CI environments
export REDIS_URL="redis://:${REDIS_PASSWORD:-redis_password}@localhost:6379/0"

# Fix for potential network issues with Docker in Jules
export DOCKER_CLIENT_TIMEOUT=120
export COMPOSE_HTTP_TIMEOUT=120

# Detect if we're running in Jules CI environment
if [ -n "$CI" ] || [ -n "$JULES_CI" ]; then
  echo "Jules CI environment detected, applying performance optimizations..."
  export ENVIRONMENT=test
  export LOG_LEVEL=INFO
  # Disable resource-intensive processes for CI
  export DISABLE_ANALYTICS=true
  export REDUCED_LOGGING=true
fi

echo "Environment variables and fixes applied for Jules environment"
