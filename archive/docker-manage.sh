#!/bin/bash

# Casino-Club F2P Docker Environment Management Script
# Advanced Docker development environment management

# Default action
ACTION=${1:-help}

# Docker Compose files
COMPOSE_FILE="docker-compose.yml"
COMPOSE_DEV_FILE="docker-compose.override.yml"

# Color output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_color() {
    echo -e "${2}${1}${NC}"
}

print_header() {
    echo ""
    print_color "=====================================" $CYAN
    print_color "🎰 Casino-Club F2P Dev Environment" $CYAN
    print_color "=====================================" $CYAN
    echo ""
}

show_help() {
    print_header
    print_color "Usage: ./docker-manage.sh <command> [service]" $YELLOW
    echo ""
    print_color "🚀 Environment Commands:" $BLUE
    echo "  start      - Start all containers"
    echo "  stop       - Stop all containers"
    echo "  restart    - Restart all containers"
    echo "  rebuild    - Rebuild services (specify service or all)"
    echo "  reset      - Reset environment (removes volumes)"
    echo ""
    print_color "📊 Monitoring Commands:" $BLUE
    echo "  status     - Show container status"
    echo "  logs       - Show logs (specify service or all)"
    echo "  health     - Show health status"
    echo "  volumes    - List project volumes"
    echo ""
    print_color "🔧 Development Commands:" $BLUE
    echo "  bash       - Open bash shell in container (requires service)"
    echo "  psql       - Connect to PostgreSQL container"
    echo "  redis-cli  - Connect to Redis container"
    echo "  test       - Run backend tests"
    echo "  migrate    - Run database migrations"
    echo ""
    print_color "🛠 Utility Commands:" $BLUE
    echo "  setup      - Initial project setup"
    echo "  cleanup    - Clean unused Docker resources"
    echo "  backup     - Backup database"
    echo "  restore    - Restore database from backup"
    echo ""
    print_color "Examples:" $YELLOW
    echo "  ./docker-manage.sh setup"
    echo "  ./docker-manage.sh start"
    echo "  ./docker-manage.sh logs backend"
    echo "  ./docker-manage.sh bash backend"
    echo "  ./docker-manage.sh test"
}

setup_environment() {
    print_header
    print_color "🔧 Setting up Casino-Club F2P development environment..." $GREEN
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_color "❌ Docker is not running. Please start Docker Desktop." $RED
        exit 1
    fi
    
    # Create necessary directories
    print_color "📁 Creating project directories..." $CYAN
    mkdir -p logs/backend
    mkdir -p logs/frontend
    mkdir -p data/postgres
    mkdir -p data/redis
    mkdir -p backups
    
    # Check environment files
    if [ ! -f ".env" ]; then
        print_color "📝 Creating .env file..." $CYAN
        cat > .env << EOF
# Casino-Club F2P Environment Configuration
ENVIRONMENT=development
DEBUG=true

# Database Configuration
POSTGRES_DB=cc_webapp
POSTGRES_USER=cc_user
POSTGRES_PASSWORD=cc_password
DATABASE_URL=postgresql://cc_user:cc_password@postgres:5432/cc_webapp

# Redis Configuration
REDIS_URL=redis://redis:6379/0

# API Configuration
API_SECRET_KEY=casino-club-secret-key-2024
JWT_SECRET_KEY=jwt-secret-key-2024
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Casino-Club F2P

# Development Settings
LOG_LEVEL=DEBUG
ENABLE_CORS=true
ENABLE_DOCS=true
EOF
    fi
    
    # Build and start services
    print_color "🏗 Building Docker images..." $CYAN
    docker-compose build
    
    print_color "🚀 Starting services..." $CYAN
    docker-compose up -d
    
    # Wait for services to be ready
    print_color "⏳ Waiting for services to be ready..." $CYAN
    sleep 10
    
    # Check service health
    check_health
    
    print_color "✅ Setup complete!" $GREEN
    show_urls
}

start_environment() {
    print_header
    print_color "🚀 Starting Casino-Club F2P environment..." $GREEN
    
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        print_color "✅ Environment started successfully!" $GREEN
        sleep 5
        check_health
        show_urls
    else
        print_color "❌ Failed to start environment. Check logs for details." $RED
    fi
}

stop_environment() {
    print_header
    print_color "🛑 Stopping Casino-Club F2P environment..." $YELLOW
    
    docker-compose down
    
    if [ $? -eq 0 ]; then
        print_color "✅ Environment stopped successfully!" $GREEN
    else
        print_color "❌ Failed to stop environment." $RED
    fi
}

restart_environment() {
    print_header
    print_color "🔄 Restarting Casino-Club F2P environment..." $YELLOW
    
    docker-compose restart
    
    if [ $? -eq 0 ]; then
        print_color "✅ Environment restarted successfully!" $GREEN
        sleep 5
        check_health
        show_urls
    else
        print_color "❌ Failed to restart environment." $RED
    fi
}

rebuild_environment() {
    print_header
    print_color "🏗 Rebuilding Casino-Club F2P environment..." $YELLOW
    
    if [ -z "$2" ]; then
        print_color "Building all services..." $CYAN
        docker-compose build --no-cache
    else
        print_color "Building $2..." $CYAN
        docker-compose build --no-cache $2
    fi
    
    if [ $? -eq 0 ]; then
        print_color "✅ Rebuild completed successfully!" $GREEN
        print_color "🔄 Do you want to restart the containers now? (y/n)" $CYAN
        read -r restart
        
        if [ "$restart" = "y" ] || [ "$restart" = "Y" ]; then
            restart_environment
        fi
    else
        print_color "❌ Failed to rebuild environment." $RED
    fi
}

show_logs() {
    if [ -z "$2" ]; then
        print_color "📋 Showing logs for all services..." $CYAN
        docker-compose logs -f --tail=100
    else
        print_color "📋 Showing logs for $2..." $CYAN
        docker-compose logs -f --tail=100 $2
    fi
}

show_status() {
    print_header
    print_color "📊 Container Status:" $CYAN
    docker-compose ps
    echo ""
    
    print_color "💾 Volume Usage:" $CYAN
    docker system df
    echo ""
}

check_health() {
    print_color "🏥 Health Check Results:" $CYAN
    
    # Check Backend Health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        print_color "✅ Backend API: Healthy" $GREEN
    else
        print_color "❌ Backend API: Unhealthy" $RED
    fi
    
    # Check Frontend Health
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_color "✅ Frontend: Healthy" $GREEN
    else
        print_color "❌ Frontend: Unhealthy" $RED
    fi
    
    # Check PostgreSQL
    if docker-compose exec -T postgres pg_isready -U cc_user > /dev/null 2>&1; then
        print_color "✅ PostgreSQL: Healthy" $GREEN
    else
        print_color "❌ PostgreSQL: Unhealthy" $RED
    fi
    
    # Check Redis
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_color "✅ Redis: Healthy" $GREEN
    else
        print_color "❌ Redis: Unhealthy" $RED
    fi
}

show_urls() {
    echo ""
    print_color "🌐 Service URLs:" $BLUE
    print_color "Frontend:     http://localhost:3000" $CYAN
    print_color "Backend API:  http://localhost:8000" $CYAN
    print_color "API Docs:     http://localhost:8000/docs" $CYAN
    print_color "ReDoc:        http://localhost:8000/redoc" $CYAN
    print_color "PostgreSQL:   localhost:5432" $CYAN
    print_color "Redis:        localhost:6379" $CYAN
    echo ""
}

run_tests() {
    print_header
    print_color "🧪 Running backend tests..." $CYAN
    
    docker-compose exec backend pytest --maxfail=5 --disable-warnings -v
    
    if [ $? -eq 0 ]; then
        print_color "✅ All tests passed!" $GREEN
    else
        print_color "❌ Some tests failed. Check output above." $RED
    fi
}

run_migrations() {
    print_header
    print_color "📊 Running database migrations..." $CYAN
    
    docker-compose exec backend alembic upgrade head
    
    if [ $? -eq 0 ]; then
        print_color "✅ Migrations completed successfully!" $GREEN
    else
        print_color "❌ Migration failed. Check logs for details." $RED
    fi
}

open_shell() {
    if [ -z "$2" ]; then
        print_color "❌ Please specify a service: backend, frontend, postgres, redis" $RED
        exit 1
    fi
    
    print_color "🖥 Opening shell in $2..." $CYAN
    docker-compose exec $2 bash
}

connect_psql() {
    print_color "🗄 Connecting to PostgreSQL..." $CYAN
    docker-compose exec postgres psql -U cc_user -d cc_webapp
}

connect_redis() {
    print_color "📦 Connecting to Redis..." $CYAN
    docker-compose exec redis redis-cli
}

reset_environment() {
    print_header
    print_color "⚠️  This will remove all containers, volumes, and data!" $RED
    print_color "Are you sure you want to reset the environment? (yes/no)" $YELLOW
    read -r confirm
    
    if [ "$confirm" = "yes" ]; then
        print_color "🗑 Resetting environment..." $YELLOW
        docker-compose down -v --remove-orphans
        docker-compose build --no-cache
        print_color "✅ Environment reset complete!" $GREEN
    else
        print_color "❌ Reset cancelled." $CYAN
    fi
}

cleanup_docker() {
    print_header
    print_color "🧹 Cleaning up Docker resources..." $CYAN
    
    docker system prune -f
    docker volume prune -f
    docker network prune -f
    
    print_color "✅ Cleanup complete!" $GREEN
}

backup_database() {
    print_header
    print_color "💾 Creating database backup..." $CYAN
    
    BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    docker-compose exec -T postgres pg_dump -U cc_user cc_webapp > $BACKUP_FILE
    
    if [ $? -eq 0 ]; then
        print_color "✅ Backup created: $BACKUP_FILE" $GREEN
    else
        print_color "❌ Backup failed!" $RED
    fi
}

restore_database() {
    if [ -z "$2" ]; then
        print_color "❌ Please specify backup file: ./docker-manage.sh restore <backup_file>" $RED
        exit 1
    fi
    
    if [ ! -f "$2" ]; then
        print_color "❌ Backup file not found: $2" $RED
        exit 1
    fi
    
    print_header
    print_color "📥 Restoring database from: $2" $CYAN
    
    docker-compose exec -T postgres psql -U cc_user -d cc_webapp < $2
    
    if [ $? -eq 0 ]; then
        print_color "✅ Database restored successfully!" $GREEN
    else
        print_color "❌ Restore failed!" $RED
    fi
}

# Main command dispatcher
case $ACTION in
    help)
        show_help
        ;;
    setup)
        setup_environment
        ;;
    start)
        start_environment
        ;;
    stop)
        stop_environment
        ;;
    restart)
        restart_environment
        ;;
    rebuild)
        rebuild_environment $@
        ;;
    logs)
        show_logs $@
        ;;
    status)
        show_status
        ;;
    health)
        check_health
        ;;
    test)
        run_tests
        ;;
    migrate)
        run_migrations
        ;;
    bash)
        open_shell $@
        ;;
    psql)
        connect_psql
        ;;
    redis-cli)
        connect_redis
        ;;
    reset)
        reset_environment
        ;;
    cleanup)
        cleanup_docker
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database $@
        ;;
    volumes)
        docker volume ls | grep auto7777
        ;;
    *)
        print_color "❌ Unknown command: $ACTION" $RED
        show_help
        exit 1
        ;;
esac
