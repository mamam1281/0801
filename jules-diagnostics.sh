#!/bin/bash
set -e

echo "====== Casino-Club F2P Jules Environment Diagnostics ======"

echo "1. Checking System Environment:"
echo "-------------------------------------"
echo "OS Information:"
uname -a
echo

echo "Docker Version:"
if command -v docker &> /dev/null; then
  docker --version
  docker info | grep "Server Version"
else
  echo "❌ Docker not found in PATH"
fi
echo

echo "Docker Compose Version:"
if command -v docker-compose &> /dev/null; then
  docker-compose --version
else
  echo "❌ Docker Compose not found in PATH"
fi
echo

echo "Python Version:"
if command -v python3 &> /dev/null; then
  python3 --version
elif command -v python &> /dev/null; then
  python --version
else
  echo "❌ Python not found in PATH"
fi
echo

echo "Node.js Version:"
if command -v node &> /dev/null; then
  node --version
else
  echo "❌ Node.js not found in PATH"
fi
echo

echo "2. Checking Environment Files:"
echo "-------------------------------------"
if [ -f ".env.jules" ]; then
  echo "✅ .env.jules file exists"
  # Check if all required variables are present
  missing_vars=()
  for var in POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD REDIS_PASSWORD JWT_SECRET_KEY API_SECRET_KEY; do
    if ! grep -q "^$var=" .env.jules; then
      missing_vars+=($var)
    fi
  done
  
  if [ ${#missing_vars[@]} -eq 0 ]; then
    echo "✅ All required environment variables are present"
  else
    echo "❌ Missing environment variables in .env.jules: ${missing_vars[*]}"
  fi
else
  echo "❌ .env.jules file not found"
fi
echo

echo "3. Checking Docker Services:"
echo "-------------------------------------"
if docker-compose ps &> /dev/null; then
  echo "Docker Compose configuration looks valid"
  
  # Check if services are defined
  services=$(docker-compose config --services 2>/dev/null)
  if [ -n "$services" ]; then
    echo "✅ Services defined: $services"
  else
    echo "❌ No services defined in docker-compose.yml"
  fi
  
  # Check if any services are running
  running_services=$(docker-compose ps --services --filter "status=running" 2>/dev/null)
  if [ -n "$running_services" ]; then
    echo "✅ Running services: $running_services"
  else
    echo "❌ No services are currently running"
  fi
else
  echo "❌ Docker Compose configuration issue detected"
fi
echo

echo "4. Checking File Permissions:"
echo "-------------------------------------"
files_to_check=("jules-setup.sh" "init-test-data.sh" "health-check.sh" "docker-compose.yml")
for file in "${files_to_check[@]}"; do
  if [ -f "$file" ]; then
    permissions=$(stat -c "%A" "$file" 2>/dev/null || ls -l "$file" | awk '{print $1}')
    echo "$file: $permissions"
    
    # Check if shell scripts are executable
    if [[ "$file" == *.sh ]]; then
      if [ -x "$file" ]; then
        echo "✅ $file is executable"
      else
        echo "❌ $file is not executable. Run: chmod +x $file"
      fi
    fi
  else
    echo "❌ $file not found"
  fi
done
echo

echo "5. Network Diagnostics:"
echo "-------------------------------------"
echo "Checking localhost ports:"
for port in 8000 3000 5432 6379 9093; do
  if nc -z localhost $port 2>/dev/null; then
    echo "✅ Port $port is open"
  else
    echo "❌ Port $port is not open"
  fi
done
echo

echo "====== Diagnostics Complete ======"
echo "If you see any issues above, please fix them before running the services"
echo "For Jules environment, ensure Docker privileges are properly set"
echo "Run './jules-setup.sh' to properly configure the environment"
