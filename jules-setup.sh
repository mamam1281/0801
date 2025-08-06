#!/bin/bash
set -e  # Exit immediately if a command fails

echo "====== Setting up Casino-Club F2P Project for Jules ======"

# Create simplified version of docker-manage for Jules environment
cat > ./docker-manage.sh << 'EOF'
#!/bin/bash
set -e

COMMAND=$1
ARGS="${@:2}"

case "$COMMAND" in
  check)
    echo "Checking environment..."
    docker --version
    docker-compose --version
    python3 --version
    node --version
    ;;
    
  setup)
    echo "Setting up environment..."
    mkdir -p cc-webapp/backend/app
    mkdir -p cc-webapp/backend/tests
    mkdir -p cc-webapp/frontend/app
    mkdir -p cc-webapp/frontend/components
    mkdir -p data/init
    mkdir -p data/backup
    mkdir -p logs/{backend,frontend,postgres,celery}
    
    # Copy environment file
    cp .env.jules .env
    
    # Build containers
    docker-compose build
    ;;
    
  start)
    echo "Starting services..."
    if [[ "$ARGS" == *"--tools"* ]]; then
      docker-compose --profile tools up -d
    else
      docker-compose up -d
    fi
    ;;
    
  shell)
    echo "Entering shell for $ARGS..."
    docker-compose exec $ARGS bash
    ;;
    
  logs)
    echo "Showing logs for $ARGS..."
    if [ -z "$ARGS" ]; then
      docker-compose logs -f
    else
      docker-compose logs -f $ARGS
    fi
    ;;
    
  test)
    if [ "$ARGS" == "coverage" ]; then
      echo "Running tests with coverage..."
      docker-compose exec backend pytest --cov=app
    elif [ "$ARGS" == "backend" ]; then
      echo "Running backend tests..."
      docker-compose exec backend pytest
    elif [ "$ARGS" == "frontend" ]; then
      echo "Running frontend tests..."
      docker-compose exec frontend npm test
    elif [ -z "$ARGS" ]; then
      echo "Running all tests..."
      docker-compose exec backend pytest
      docker-compose exec frontend npm test
    else
      echo "Running tests for $ARGS..."
      docker-compose exec $ARGS pytest
    fi
    ;;
    
  migrate)
    echo "Running database migrations..."
    docker-compose exec backend alembic upgrade head
    ;;
    
  seed)
    echo "Seeding test data..."
    bash ./init-test-data.sh
    ;;
    
  backup)
    echo "Creating database backup..."
    TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
    docker-compose exec postgres pg_dump -U cc_user -d cc_webapp > ./data/backup/db_backup_${TIMESTAMP}.sql
    echo "Backup created: ./data/backup/db_backup_${TIMESTAMP}.sql"
    ;;
    
  reset-db)
    echo "Resetting database..."
    docker-compose exec postgres psql -U cc_user -c "DROP DATABASE IF EXISTS cc_webapp;"
    docker-compose exec postgres psql -U cc_user -c "CREATE DATABASE cc_webapp;"
    echo "Database reset. Run migrations with './docker-manage.sh migrate'"
    ;;
    
  status)
    echo "Service status:"
    docker-compose ps
    ;;
    
  monitor)
    echo "Monitoring resource usage:"
    docker stats
    ;;
    
  restart)
    echo "Restarting services..."
    if [ -z "$ARGS" ]; then
      docker-compose restart
    else
      docker-compose restart $ARGS
    fi
    ;;
    
  stop)
    echo "Stopping services..."
    docker-compose down
    ;;
    
  clean)
    echo "Cleaning up resources..."
    if [ "$ARGS" == "containers" ]; then
      docker-compose down
      echo "Containers removed"
    elif [ "$ARGS" == "volumes" ]; then
      docker-compose down -v
      echo "Containers and volumes removed"
    else
      docker-compose down
      echo "Containers removed"
    fi
    ;;
    
  help)
    echo "Casino-Club F2P Docker Management Script"
    echo "Usage: ./docker-manage.sh COMMAND [ARGS]"
    echo ""
    echo "Commands:"
    echo "  check               Check development environment"
    echo "  setup               Set up initial environment"
    echo "  start [--tools]     Start services (--tools for development tools)"
    echo "  shell SERVICE       Enter shell for a service"
    echo "  logs [SERVICE]      Show logs for all or specific service"
    echo "  test [coverage|backend|frontend]  Run tests"
    echo "  migrate             Run database migrations"
    echo "  seed                Seed test data"
    echo "  backup              Create database backup"
    echo "  reset-db            Reset database"
    echo "  status              Check service status"
    echo "  monitor             Monitor resource usage"
    echo "  restart [SERVICE]   Restart all or specific service"
    echo "  stop                Stop all services"
    echo "  clean [containers|volumes]  Clean up resources"
    echo "  help                Show this help message"
    ;;
    
  *)
    echo "Unknown command: $COMMAND"
    echo "Run './docker-manage.sh help' for available commands"
    exit 1
    ;;
esac
EOF

chmod +x ./docker-manage.sh

# Main Jules setup script
echo "Setting up project structure..."
# Create necessary directories
mkdir -p cc-webapp/backend/app
mkdir -p cc-webapp/backend/tests
mkdir -p cc-webapp/frontend/app
mkdir -p cc-webapp/frontend/components
mkdir -p data/init
mkdir -p data/backup
mkdir -p logs/{backend,frontend,postgres,celery}

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
  echo "Copying Jules environment file to .env..."
  cp .env.jules .env
fi

# Make scripts executable
chmod +x ./init-test-data.sh
chmod +x ./health-check.sh

echo "Running initial environment check..."
./docker-manage.sh check

echo "====== Jules Setup Completed ======"
echo "Next steps:"
echo "1. Build and start services: './docker-manage.sh setup && ./docker-manage.sh start'"
echo "2. Run health check: './health-check.sh'"
echo "3. Load test data: './docker-manage.sh seed'"
echo "4. Run tests: './docker-manage.sh test'"
